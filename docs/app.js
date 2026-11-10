'use strict';
const $=s=>document.querySelector(s),KEY='shisui-test-favorites-v1';
let answers=[],current=null,saved=[],busy=false,storageOK=true,noticeTimer;
function notify(text){$('#status').textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#status').textContent='',5500)}
try{const raw=localStorage.getItem(KEY);if(raw)saved=Shisui.validateSaved(JSON.parse(raw)).items}catch{storageOK=false;notify('無法讀取收藏，原資料未覆寫。本次收藏僅暫存，關閉頁面後會遺失。')}
function persist(next){saved=next;if(storageOK){try{localStorage.setItem(KEY,JSON.stringify({version:1,items:saved}))}catch{storageOK=false}}if(!storageOK)notify('無法儲存到瀏覽器；本次收藏僅暫存，關閉頁面後會遺失。');syncCount()}
function syncCount(){$('#saved-count').textContent=saved.length}
function syncFavorite(){const active=current&&saved.some(row=>row.id===current.id);$('#favorite').setAttribute('aria-pressed',String(!!active));$('#favorite').textContent=active?'已收藏 · 點此取消':'收藏這一頁'}
function collapse(){$('#reflection').hidden=true;$('#expand').setAttribute('aria-expanded','false');$('#expand').replaceChildren(document.createTextNode('展開哲理 '),sign('＋'))}
function sign(s){const span=document.createElement('span');span.textContent=s;span.setAttribute('aria-hidden','true');return span}
function display(row,animate=false){
 current=row;$('#answer').textContent=row.answer;$('#reflection').textContent=row.reflection;
 const index=answers.findIndex(x=>x.id===row.id);$('#page-number').textContent=index<0?'收藏書頁':'頁 '+String(index+1).padStart(3,'0');
 collapse();syncFavorite();$('#book').hidden=true;$('#page').hidden=false;$('#book-hint').textContent='想換個角度，就再翻一頁。';$('#again').disabled=!answers.length;$('#answer').focus({preventScroll:true});
 if(animate){$('#page').classList.remove('turning');void $('#page').offsetWidth;$('#page').classList.add('turning')}
}
function draw(){if(busy||!answers.length)return;busy=true;display(Shisui.pick(answers,current?.id),true);$('#again').disabled=true;setTimeout(()=>{busy=false;$('#page').classList.remove('turning');$('#again').disabled=!answers.length},matchMedia('(prefers-reduced-motion: reduce)').matches?0:470)}
function renderSaved(){
 const list=$('#saved-list');list.replaceChildren();
 if(!saved.length){const box=document.createElement('div');box.className='empty';const img=document.createElement('img');img.src='wheat.svg';img.alt='';const p=document.createElement('p');p.textContent='還沒有收藏。遇見喜歡的句子，就把它留下。';const a=document.createElement('a');a.href='#read';a.textContent='去翻一頁 →';box.append(img,p,a);list.append(box);return}
 for(const row of saved){const card=document.createElement('article');card.className='saved-card';const date=document.createElement('small');date.textContent='拾於 '+new Date(row.savedAt).toLocaleDateString('zh-TW');const title=document.createElement('h2');title.textContent=row.answer;const actions=document.createElement('div');actions.className='row';const open=document.createElement('button');open.textContent='重讀這一頁 ↗';open.addEventListener('click',()=>{display(row);location.hash='read'});const remove=document.createElement('button');remove.textContent='取消收藏';remove.setAttribute('aria-label','取消收藏：'+row.answer);remove.addEventListener('click',()=>{persist(saved.filter(x=>x.id!==row.id));renderSaved();syncFavorite();if(storageOK)notify('已取消收藏')});actions.append(open,remove);card.append(date,title,actions);list.append(card)}
}
function route(){const isSaved=location.hash==='#saved';$('#read-view').hidden=isSaved;$('#saved-view').hidden=!isSaved;$('#nav-read').toggleAttribute('aria-current',!isSaved);$('#nav-saved').toggleAttribute('aria-current',isSaved);$('#nav-read').setAttribute('aria-current',isSaved?'false':'page');$('#nav-saved').setAttribute('aria-current',isSaved?'page':'false');if(isSaved){renderSaved();$('#saved-title').focus({preventScroll:true})}window.scrollTo(0,0)}
async function load(){
 $('#retry').disabled=true;$('#load-error').hidden=true;$('#book').disabled=true;$('#book-hint').textContent='正在整理書頁…';
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
 try{const response=await fetch('./answers.json',{cache:'no-cache',signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);answers=Shisui.validateAnswers(await response.json());$('#data-count').textContent=answers.length;$('#book').disabled=false;$('#again').disabled=false;$('#book-hint').textContent=current?'想換個角度，就再翻一頁。':'輕觸書封，翻開一頁 ↗'}
 catch{$('#load-error').hidden=false;$('#error-text').textContent='暫時無法讀取答案庫。請確認連線及 answers.json 格式後重試。';$('#book-hint').textContent='收藏紀錄仍可在「我的拾穗」閱讀。';$('#again').disabled=true}
 finally{clearTimeout(timeout);$('#retry').disabled=false}
}
$('#book').addEventListener('click',draw);$('#again').addEventListener('click',draw);$('#retry').addEventListener('click',load);
$('#expand').addEventListener('click',()=>{const show=$('#reflection').hidden;$('#reflection').hidden=!show;$('#expand').setAttribute('aria-expanded',String(show));$('#expand').replaceChildren(document.createTextNode(show?'收起哲理 ':'展開哲理 '),sign(show?'－':'＋'))});
$('#favorite').addEventListener('click',()=>{if(!current)return;const was=saved.some(r=>r.id===current.id);persist(Shisui.toggleSaved(saved,current,new Date().toISOString()));syncFavorite();if(storageOK)notify(was?'已取消收藏':'已拾起這一頁，收進收藏')});
window.addEventListener('hashchange',route);
window.addEventListener('storage',e=>{if(e.key===KEY){try{saved=e.newValue?Shisui.validateSaved(JSON.parse(e.newValue)).items:[];syncCount();syncFavorite();if(location.hash==='#saved')renderSaved()}catch{notify('其他分頁的收藏無法讀取；目前畫面保留原紀錄。')}}});
syncCount();route();load();
