// A small Chrome DevTools client using Node's built-in WebSocket. No npm dependencies.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import path from 'node:path';

export async function launchBrowser() {
  const candidates = [process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    path.join(homedir(), 'Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].filter(Boolean);
  let executable;
  for (const file of candidates) { try { await access(file); executable=file; break; } catch {} }
  if (!executable) throw Error('Chrome/Chromium tidak ditemukan. Isi CHROME_PATH ke executable browser.');
  const profile = await mkdtemp(path.join(tmpdir(), 'stickerio-landing-'));
  const child = spawn(executable, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-extensions', '--disable-default-apps', '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank'], { stdio:['ignore','ignore','pipe'] });
  let socket;
  const pending = new Map();
  const listeners = new Map();
  let counter = 0;
  async function close() {
    socket?.close();
    if (child.exitCode === null && child.signalCode === null) {
      const done = new Promise(resolve => child.once('exit', resolve));
      child.kill('SIGTERM');
      const timer=setTimeout(() => child.kill('SIGKILL'), 3000);
      await done; clearTimeout(timer);
    }
    await rm(profile, { recursive:true, force:true, maxRetries:5, retryDelay:150 });
  }
  try {
    const endpoint = await new Promise((resolve, reject) => {
      let buffer=''; const timer=setTimeout(() => reject(Error('Chrome startup timed out.')), 20000);
      child.once('error', e => {clearTimeout(timer);reject(e)});
      child.once('exit', code => {clearTimeout(timer);reject(Error(`Chrome exited (${code}). ${buffer.slice(-600)}`))});
      child.stderr.on('data', chunk => { buffer+=chunk; const match=buffer.match(/DevTools listening on (ws:\/\/[^\s]+)/); if(match) {clearTimeout(timer);resolve(match[1])} });
    });
    socket = new WebSocket(endpoint);
    await new Promise((resolve,reject) => {socket.addEventListener('open', resolve, {once:true});socket.addEventListener('error', reject, {once:true})});
    socket.addEventListener('message', event => {
      const msg=JSON.parse(event.data);
      if(msg.id) { const wait=pending.get(msg.id); if(wait) {clearTimeout(wait.timer);pending.delete(msg.id);msg.error ? wait.reject(Error(msg.error.message)) : wait.resolve(msg.result)} }
      else for(const listener of listeners.get(msg.method) || []) listener(msg.params, msg.sessionId);
    });
    const send=(method, params={}, sessionId) => new Promise((resolve,reject) => {
      const id=++counter; const timer=setTimeout(() => {pending.delete(id);reject(Error(`CDP timed out: ${method}`))}, 25000);
      pending.set(id, {resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...(sessionId ? {sessionId} : {})}));
    });
    const {targetId}=await send('Target.createTarget', {url:'about:blank'});
    const {sessionId}=await send('Target.attachToTarget', {targetId,flatten:true});
    const call=(method,params={}) => send(method, params, sessionId);
    const on=(name, callback) => {const all=listeners.get(name) || new Set();const listener=(params,sid) => {if(sid===sessionId)callback(params)};all.add(listener);listeners.set(name,all);return () => all.delete(listener)};
    await call('Page.enable'); await call('Runtime.enable');
    async function evaluate(expression) {
      const result=await call('Runtime.evaluate', {expression,awaitPromise:true,returnByValue:true});
      if(result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    }
    async function navigate(url,width=1440,height=1050) {
      await call('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor:1,mobile:false});
      const load=new Promise((resolve,reject) => { const timer=setTimeout(() => {off();reject(Error(`Page load timed out: ${url}`))},20000); const off=on('Page.loadEventFired',()=>{off();clearTimeout(timer);resolve()}) });
      await call('Page.navigate',{url});await load;
      await evaluate(`(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.loading!=='lazy').map(i=>i.decode().catch(()=>{})));return true})()`);
    }
    async function screenshot(file,{width,height,full=false}={}) {
      let clip;
      if(full) {const metrics=await call('Page.getLayoutMetrics');clip={x:0,y:0,width:Math.ceil(metrics.cssContentSize.width),height:Math.ceil(metrics.cssContentSize.height),scale:1}}
      else if(width && height) clip={x:0,y:0,width,height,scale:1};
      const {data}=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,...(clip?{clip}:{})});
      const {writeFile}=await import('node:fs/promises');await writeFile(file,Buffer.from(data,'base64'));
    }
    return {call,on,evaluate,navigate,screenshot,close};
  } catch(e) {await close();throw e}
}
