import { readFile, mkdir } from 'node:fs/promises';
import { createServer, root } from './serve.mjs';
import { launchBrowser } from './browser.mjs';
import './build.mjs';

const local=await createServer();
let browser;
try {
  browser=await launchBrowser();
  const manifest=JSON.parse(await readFile(root+'assets/export-manifest.json','utf8'));
  await mkdir(root+'assets/store', {recursive:true});
  for(const item of manifest) {
    await browser.navigate(local.url+'/mockups.html',item.width,item.height);
    await browser.evaluate(`(()=>{document.body.classList.add('export-mode');document.getElementById(${JSON.stringify(item.id)}).classList.add('export-target');return true})()`);
    if(item.id==='store-icon') {
      await browser.call('Emulation.setDefaultBackgroundColorOverride',{color:{r:0,g:0,b:0,a:0}});
      await browser.evaluate(`document.documentElement.style.background='transparent';document.body.style.setProperty('background','transparent','important');document.getElementById('store-icon').style.background='transparent';true`);
    }
    // Wait two animation frames so styles and SVG images finish painting.
    await browser.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
    await browser.screenshot(root+`assets/store/${item.id}.png`,item);
    console.log(`Exported ${item.id}.png (${item.width} × ${item.height})`);
  }
} finally {await browser?.close();await local.close()}
