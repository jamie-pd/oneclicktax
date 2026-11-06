const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:2,viewport:{width:1400,height:900}});
await p.goto('file://'+require('path').resolve(__dirname,'frames.html'));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
for(const id of ['hero','step-1','step-2','step-3','feature-calc','feature-hometax']){
 if(id==='who-1')await p.evaluate(()=>document.body.style.background='transparent');await p.locator('#'+id).screenshot({path:require('path').resolve(__dirname,'..')+'/'+id+'.png',omitBackground:id.startsWith('who')});}
await b.close();})();
