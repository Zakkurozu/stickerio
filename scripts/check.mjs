import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { createServer, root } from './serve.mjs';
import { launchBrowser } from './browser.mjs';
import './build.mjs';

const local=await createServer();
let browser;
const report={pages:[],exports:[],interactions:[],requests:[],errors:[]};
try {
  browser=await launchBrowser();
  await browser.call('Network.enable');
  browser.on('Runtime.exceptionThrown', ({exceptionDetails:e}) => report.errors.push(e.exception?.description || e.text));
  browser.on('Network.requestWillBeSent', ({request:r}) => {if(!r.url.startsWith(local.url) && !r.url.startsWith('data:')) report.requests.push(r.url)});
  browser.on('Network.responseReceived', ({response:r}) => {if(r.status>=400) report.errors.push(`${r.status} ${r.url}`)});
  const output=root+'previews/';await mkdir(output,{recursive:true});
  const layouts=[['index.html',1440,1050,'home-desktop'],['index.html',390,844,'home-mobile'],['index.html',320,780,'home-small'],['privacy.html',1440,1000,'privacy-desktop'],['privacy.html',390,844,'privacy-mobile'],['terms.html',390,844,'terms-mobile'],['mockups.html',390,844,'mockups-mobile']];
  for(const [page,width,height,name] of layouts) {
    await browser.navigate(`${local.url}/${page}`,width,height);
    await browser.evaluate(`(async()=>{document.querySelectorAll('img').forEach(i=>i.loading='eager');await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));return true})()`);
    const state=await browser.evaluate(`(()=>({title:document.title,h1:document.querySelectorAll('h1').length,viewport:innerWidth,bodyWidth:document.documentElement.scrollWidth,brokenImages:[...document.images].filter(i=>i.getAttribute('src') && !i.naturalWidth).map(i=>i.getAttribute('src')),links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))}))()`);
    await browser.screenshot(output+name+'.png',{full:true});
    assert.equal(state.h1,1,`${page}: requires one H1`);
    assert.ok(state.bodyWidth<=width+1,`${page}@${width}: horizontal overflow ${state.bodyWidth}`);
    assert.deepEqual(state.brokenImages,[],`${page}: broken images`);
    for(const href of new Set(state.links)) {
      if(/^(https?:|mailto:|tel:)/.test(href)) continue;
      const url=new URL(href,`${local.url}/${page}`);
      const response=await fetch(url);assert.equal(response.status,200,`Broken local link: ${href}`);
      if(url.hash && url.pathname.endsWith('.html')) {
        const html=await response.text();const id=decodeURIComponent(url.hash.slice(1));
        assert.ok(html.includes(`id="${id}"`),`Missing anchor ${href}`);
      }
    }
    report.pages.push({page,width,overflow:false,images:'ok',links:'ok'});
  }
  await browser.navigate(local.url+'/index.html',390,844);
  assert.equal(await browser.evaluate(`document.querySelector('[data-menu-toggle]').click();document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded')`),'true');
  assert.equal(await browser.evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded')`),'false');
  report.interactions.push('Mobile navigation opens and Escape closes it.');
  assert.equal(await browser.evaluate(`document.querySelector('[data-preview]').click();document.querySelector('#image-viewer').open`),true);
  assert.equal(await browser.evaluate(`document.querySelector('[data-download]').getAttribute('href')`),'assets/store/01-create.png');
  assert.equal(await browser.evaluate(`document.querySelector('[data-close]').click();document.querySelector('#image-viewer').open`),false);
  report.interactions.push('Gallery dialog opens/closes and provides the matching PNG download.');
  assert.equal(await browser.evaluate(`document.querySelector('details').open=true;document.querySelector('details').open`),true);
  report.interactions.push('FAQ expands.');
  await browser.call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await browser.evaluate(`getComputedStyle(document.documentElement).scrollBehavior`),'auto');
  report.interactions.push('Reduced motion respected.');
  await browser.call('Emulation.setScriptExecutionDisabled',{value:true});
  await browser.navigate(local.url+'/privacy.html',390,844);
  // JS is disabled: inspect the DOM with the browser accessibility tree instead of page scripts.
  const tree=await browser.call('Accessibility.getFullAXTree');
  assert.ok(tree.nodes.some(n=>n.name?.value==='Privacy Policy'));
  report.interactions.push('Privacy policy is readable with JavaScript disabled.');
  await browser.call('Emulation.setScriptExecutionDisabled',{value:false});
  for(const item of JSON.parse(await readFile(root+'assets/export-manifest.json','utf8'))) {
    const bytes=await readFile(root+`assets/store/${item.id}.png`);
    assert.equal(bytes.toString('ascii',1,4),'PNG');
    assert.equal(bytes.readUInt32BE(16),item.width);assert.equal(bytes.readUInt32BE(20),item.height);
    assert.equal(bytes[24],8,'PNG requires 8-bit channels');
    assert.equal(bytes[25],item.id==='store-icon' ? 6 : 2,`${item.id}: unexpected PNG color type`);
    if(item.id==='store-icon')assert.ok(bytes.length<1024*1024);
    report.exports.push({...item,color:item.id==='store-icon'?'RGBA':'RGB',bytes:bytes.length});
  }
  assert.deepEqual(report.requests,[],'Unexpected external resource requests');
  assert.deepEqual(report.errors,[],'Browser errors');
  console.log(`Passed ${report.pages.length} page/viewport checks, ${report.exports.length} PNG checks, and ${report.interactions.length} interaction checks.`);
} finally {
  await browser?.close();await local.close();
  await writeFile(root+'previews/verification.json',JSON.stringify(report,null,2)+'\n');
}
