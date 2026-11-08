// frames.html의 폰 목업 6개를 index.html 이미지 칸에 HTML로 넣습니다. 다시 실행해도 같은 자리만 교체돼요.
// 사용법: node images/_source/embed.js
const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
const SRC=path.resolve(__dirname,'frames.html'), PAGE=path.resolve(__dirname,'../../index.html');
const SLOTS={'hero':'원클릭 원천세 홈 화면, 6월 원천세 신고 완료','step-1':'원클릭 원천세 카카오 로그인 화면','step-2':'소득자 정보 입력 화면','step-3':'간이 지급 명세서 제출 화면','feature-calc':'소득자 등록 화면과 세금 자동 계산 결과','feature-hometax':'신고 완료 화면과 홈택스 접수 결과'};
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage();
  await p.goto('file://'+SRC); await p.evaluate(()=>document.fonts.ready);
  const css=await p.$eval('style',s=>s.textContent);
  const frames={}; for(const id of Object.keys(SLOTS)) frames[id]=await p.$eval('#'+id,e=>e.outerHTML);
  await b.close();
  const pre=s=>s.replace(/var\(--([\w-]+)/g,'var(--mk-$1');
  // CSS: 규칙 단위로 선택자에 mk- 접두어, :root 변수는 .mk-f로 범위 한정
  let out=[]; css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/([^{}]+)\{([^{}]*)\}/g,(m,sel,body)=>{
    sel=sel.trim(); body=pre(body).replace(/(^|;)\s*--([\w-]+)\s*:/g,'$1--mk-$2:');
    if(sel==='body') return '';
    if(sel===':root') sel='.mk-f';
    else if(sel==='*') sel='.mk-f,.mk-f *';
    else sel=sel.replace(/\.([a-zA-Z][\w-]*)/g,'.mk-$1');
    if(sel==='.mk-f') body=body.replace(/margin:\s*20px;?/,'');
    out.push(sel+'{'+body+'}'); return '';});
  const mkcss='/* mk:start — images/_source/embed.js가 생성. 직접 고치지 말고 frames.html을 고친 뒤 다시 실행 */\n'+out.join('\n')+
    '\n.slot.mk-slot{border:0;background:none}.mk-stage{position:absolute;inset:0;overflow:hidden}.mk-stage>.mk-f{position:absolute;left:0;top:0;transform-origin:0 0}\n/* mk:end */';
  const fix=h=>pre(h).replace(/class="([^"]*)"/g,(m,c)=>'class="'+c.split(/\s+/).filter(Boolean).map(x=>'mk-'+x).join(' ')+'"')
    .replace(/\s(id|data-screen|data-zoom)="[^"]*"/g,'').replace(/src="app-assets\//g,'src="images/app/').replace(/src="3d\//g,'src="images/3d/')
    .replace(/<img /g,'<img alt="" ');
  let html=fs.readFileSync(PAGE,'utf8');
  html=html.replace(/\n?\/\* mk:start[\s\S]*?\/\* mk:end \*\//,'');
  html=html.replace('</style>',mkcss+'\n</style>');
  for(const [id,label] of Object.entries(SLOTS)){
    // 처음엔 <img src="images/ID.png">가 든 칸, 다시 실행하면 data-mk="ID" 칸을 찾음 (목업 안에는 <figure>가 없음)
    const m=html.match(new RegExp('<figure class="slot([^"]*)"[^>]*data-mk="'+id+'"[^>]*>[\\s\\S]*?</figure>'))
         ||html.match(new RegExp('<figure class="slot([^"]*)"[^>]*>\\s*<img src="images/'+id+'\\.png"[\\s\\S]*?</figure>'));
    if(!m) throw new Error('slot not found: '+id);
    const cls=m[1].replace(/\s*mk-slot/,''); const style=(m[0].match(/style="[^"]*"/)||[''])[0];
    const fig=`<figure class="slot${cls} mk-slot" ${style} data-mk="${id}" role="img" aria-label="${label}"><div class="mk-stage" aria-hidden="true">${fix(frames[id])}</div></figure>`;
    html=html.replace(m[0],fig);
  }
  const fit='<script id="mk-fit">(()=>{const fit=s=>{const f=s.firstElementChild;if(f&&f.offsetWidth)f.style.transform="scale("+s.clientWidth/f.offsetWidth+")"};const ro="ResizeObserver" in window?new ResizeObserver(es=>es.forEach(e=>fit(e.target))):null;document.querySelectorAll(".mk-stage").forEach(s=>{fit(s);ro&&ro.observe(s)});document.fonts&&document.fonts.ready.then(()=>document.querySelectorAll(".mk-stage").forEach(fit))})();</script>';
  html=html.replace(/<script id="mk-fit">[\s\S]*?<\/script>\n?/,'');
  html=html.replace('</body>',fit+'\n</body>');
  fs.writeFileSync(PAGE,html); console.log('embedded',Object.keys(SLOTS).length,'mockups,',out.length,'css rules');
})();
