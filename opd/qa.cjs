const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({headless:true});
 const page = await browser.newPage();
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/opd/');
 await page.waitForLoadState('networkidle');
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:900});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow ${width}`);
 }
 assert(await page.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)),'Assets failed');
 await page.locator('nav [data-page="patients"]').click();
 await page.locator('#search').fill('VAC-DEMO-002');
 assert.equal(await page.locator('#results .row').count(),1);
 await page.locator('#results button').click();
 assert(await page.locator('#case').isVisible());
 await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('main').isVisible(),false);
 await page.emulateMedia({media:'screen'});
 await page.locator('#close').click();
 await page.locator('#search').fill('NOT-FOUND');
 assert.equal(await page.locator('#results .row').count(),0);
 await page.locator('nav [data-page="reports"]').click();
 assert.match(await page.locator('#month').inputValue(),/^\d{4}-\d{2}$/);
 await page.locator('nav [data-page="dashboard"]').click();
 await page.locator('#text-size').click();
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Large text overflow');
 await page.screenshot({path:'/workspace/scratch/1e8de2ce4e0d/clinic/opd/mobile-preview.png',fullPage:true});
 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null).catch(async()=>{await page.reload()});
 await page.context().setOffline(true);
 await page.reload();
 assert.equal(await page.title(),'विष्णु आयुर्वेद • OPD Workspace');
 assert.deepEqual(errors,[]);
 console.log('PASS: 4 viewport widths, images, search, dialog, print visibility, month, large text, offline shell; no JS errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
