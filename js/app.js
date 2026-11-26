let balance=1000,latestDrop='',inventory=[],caseCatalog=[];
const CASE_PRICE=100;
try{const saved=JSON.parse(localStorage.getItem('cs2cases-save')||'null');if(saved&&Number.isFinite(saved.balance)){balance=Math.max(0,saved.balance);latestDrop=typeof saved.latestDrop==='string'?saved.latestDrop:'';inventory=Array.isArray(saved.inventory)?saved.inventory.filter(x=>x&&typeof x.name==='string'&&Number.isFinite(x.price)) : []}}catch(e){}
const $=id=>document.getElementById(id),money=n=>Math.round(n).toLocaleString('ru-RU')+' ₽';
function saveGame(){try{localStorage.setItem('cs2cases-save',JSON.stringify({balance,latestDrop,inventory}))}catch(e){}}
function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function render(){
 saveGame();
 $('balance').textContent=money(balance);
 $('recent-drop').textContent=latestDrop||'Пока не открывал кейсы';
 renderInventory();
}
render();
function renderInventory(){
 const grid=$('inventory-grid'),count=$('inventory-count');
 if(!grid||!count)return;
 count.textContent=inventory.length+' предметов';
 grid.innerHTML=inventory.length?inventory.slice().reverse().map(item=>'<article class="inventory-item"><div class="inventory-item-art">'+(item.image?'<img src="'+escapeHTML(item.image)+'" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'">':'')+'<span class="inventory-item-fallback" '+(item.image?'style="display:none"':'')+'>🔫</span></div><div class="inventory-item-info"><b>'+escapeHTML(item.name)+'</b><span>'+escapeHTML(item.rarity||'CS2 skin')+'</span><strong>≈ '+money(item.price)+'</strong></div></article>').join(''):'<div class="inventory-empty"><span>🎒</span><b>Инвентарь пока пуст</b><p>Открой кейс и забери первый предмет — он появится здесь</p><button data-page="cases">Перейти к кейсам</button></div>';
 grid.querySelectorAll('[data-page="cases"]').forEach(button=>button.onclick=()=>showPage('cases'));
}
function showPage(page){
 const isInventory=page==='inventory';
 $('home-dashboard').classList.toggle('hidden',isInventory);
 $('case-catalog').classList.toggle('hidden',isInventory);
 $('inventory-page').classList.toggle('hidden',!isInventory);
 document.querySelectorAll('.bottom-nav [data-page]').forEach(button=>button.classList.toggle('active',button.dataset.page===page));
 window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.bottom-nav [data-page]').forEach(button=>button.addEventListener('click',()=>showPage(button.dataset.page)));

const CASES_API='https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json';
const rarityWeights={'Consumer Grade':79.92,'Industrial Grade':15.98,'Mil-Spec Grade':3.2,'Restricted':0.64,'Classified':0.128,'Covert':0.0256,'Extraordinary':0.0064};
const rarityPrices={'Consumer Grade':[8,22],'Industrial Grade':[20,55],'Mil-Spec Grade':[45,120],'Restricted':[100,260],'Classified':[220,650],'Covert':[600,1800],'Extraordinary':[2500,9000]};
function normalizeDrop(item){
 const rarity=item.rarity||item.rarity_name||{},rarityName=typeof rarity==='string'?rarity:(rarity.name||rarity.localized_name||'Mil-Spec Grade');
 return {name:item.name||'Неизвестный предмет',image:item.image||'',rarity:rarityName,icon:'🔫'};
}
function getCaseDrops(crate){
 const normal=Array.isArray(crate.contains)?crate.contains:[];
 const rare=Array.isArray(crate.contains_rare)?crate.contains_rare:[];
 return [...normal,...rare].filter(x=>x&&x.name).map(normalizeDrop);
}
function chooseDrop(crate){
 const normal=(crate.contains||[]).filter(x=>x&&x.name).map(normalizeDrop);
 const rare=(crate.contains_rare||[]).filter(x=>x&&x.name).map(x=>({...normalizeDrop(x),rarity:'Extraordinary'}));
 const all=[...normal,...rare];if(!all.length)return null;
 const groups={};all.forEach(x=>{const key=x.rarity in rarityWeights?x.rarity:'Mil-Spec Grade';(groups[key]??=[]).push(x)});
 const available=Object.keys(groups),total=available.reduce((sum,key)=>sum+(rarityWeights[key]||1),0);
 let roll=Math.random()*total,selected=available[0];
 for(const key of available){roll-=rarityWeights[key]||1;if(roll<=0){selected=key;break}}
 const pool=groups[selected]||all,drop={...pool[Math.floor(Math.random()*pool.length)]};
 const range=rarityPrices[selected]||[45,120];drop.price=Math.round(range[0]+Math.random()*(range[1]-range[0]));return drop;
}
function dropCard(drop){return '<div class="cs2-reel-item"><div class="cs2-reel-art">'+(drop.image?'<img class="cs2-reel-image" src="'+escapeHTML(drop.image)+'" alt="" onerror="this.style.display=\'none\'">':'<span class="skin-fallback">🔫</span>')+'</div><b>'+escapeHTML(drop.name)+'</b></div>'}
function showOpening(crate){
 const modal=document.createElement('div');modal.className='modal';modal.id='case-opening-modal';
 modal.innerHTML='<div class="dialog"><button class="close" id="opening-close" aria-label="Закрыть">×</button><div class="opening-top"><span class="opening-kicker">CS2 CASE OPENING</span><h2>'+escapeHTML(crate.name)+'</h2><p>Удачи! Посмотрим, что внутри.</p></div><div class="opening-stage"><div class="cs2-reel"><div class="cs2-reel-track" id="reel-track"></div></div><div class="opening-pointer"></div><div class="case-burst" id="case-burst"><i class="burst-ring"></i><div class="burst-box">📦</div><span>ОТКРЫВАЕМ КЕЙС</span></div></div><div class="opening-status" id="opening-status"><i class="opening-pulse"></i>ПОДГОТОВКА</div><div id="opening-result" class="hidden"><h3 class="opening-drop-name" id="opening-drop-name"></h3><b class="opening-drop-price" id="opening-drop-price"></b><button class="opening-claim" id="opening-claim">Забрать предмет</button></div><div class="opening-footnote">Демо-режим · стоимость открытия '+money(CASE_PRICE)+'</div></div>';
 document.body.appendChild(modal);
 const close=()=>modal.remove();$('opening-close').onclick=close;
 modal.addEventListener('click',e=>{if(e.target===modal)close()});
 const winner=chooseDrop(crate);if(!winner){$('opening-status').textContent='В этом кейсе пока нет списка предметов.';return}
 const drops=getCaseDrops(crate);const track=$('reel-track'),winnerIndex=52;
 const reel=Array.from({length:60},(_,i)=>i===winnerIndex?winner:drops[Math.floor(Math.random()*drops.length)]);
 track.innerHTML=reel.map(dropCard).join('');
 const status=$('opening-status'),burst=$('case-burst'),result=$('opening-result');
 window.setTimeout(()=>{
  burst.classList.add('burst-out');status.innerHTML='<i class="opening-pulse"></i>РУЛЕТКА КРУТИТСЯ…';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   const cardWidth=150,cardCenter=winnerIndex*cardWidth+71,offset=Math.max(0,modal.querySelector('.opening-stage').clientWidth/2-cardCenter);
   track.style.transition='transform 6.2s cubic-bezier(.08,.72,.08,1)';track.style.transform='translate3d('+offset+'px,0,0)';
  }));
  window.setTimeout(()=>{
   status.textContent='ВЫПАЛ ПРЕДМЕТ!';$('opening-drop-name').textContent=winner.name;$('opening-drop-price').textContent='≈ '+money(winner.price);
   result.classList.remove('hidden');const stage=modal.querySelector('.opening-stage');
   stage.insertAdjacentHTML('beforeend','<div class="opening-winner">'+(winner.image?'<img class="reveal-image" src="'+escapeHTML(winner.image)+'" alt="'+escapeHTML(winner.name)+'" onerror="this.style.display=\'none\'">':'<span class="burst-box">🔫</span>')+'</div>');
   $('opening-claim').onclick=()=>{latestDrop=winner.name;inventory.push({...winner});render();close()};
  },6400);
 },800);
}
async function renderCaseCatalog(){
 const grid=$('case-catalog-grid'),count=$('case-count');if(!grid||!count)return;
 try{
  const response=await fetch(CASES_API,{cache:'no-cache'});if(!response.ok)throw new Error('Не удалось загрузить каталог');
  const data=await response.json();
  caseCatalog=data.filter(item=>item&&item.type==='Case'&&/case/i.test(item.name||'')&&getCaseDrops(item).length)
   .sort((a,b)=>String(b.first_sale_date||'').localeCompare(String(a.first_sale_date||'')));
  if(!caseCatalog.length)throw new Error('Список кейсов пока недоступен');
  count.textContent=caseCatalog.length+' кейсов';
  grid.innerHTML=caseCatalog.map((item,index)=>'<article class="case-catalog-card"><div class="case-catalog-art"><img src="'+escapeHTML(item.image||'')+'" alt="'+escapeHTML(item.name)+'" loading="'+(index<6?'eager':'lazy')+'" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><span class="case-image-fallback" aria-hidden="true">📦</span></div><div class="case-catalog-info"><h3>'+escapeHTML(item.name)+'</h3><span>'+(item.first_sale_date?new Date(item.first_sale_date+'T00:00:00').toLocaleDateString('ru-RU'):'CS2')+'</span></div><button class="case-open-button" data-open-case="'+index+'">ОТКРЫТЬ · '+money(CASE_PRICE)+'</button></article>').join('');
  grid.querySelectorAll('[data-open-case]').forEach(button=>button.onclick=()=>{if(balance<CASE_PRICE){alert('Недостаточно средств! Нужно '+money(CASE_PRICE)+'.');return}const crate=caseCatalog[Number(button.dataset.openCase)];balance-=CASE_PRICE;render();showOpening(crate)});
 }catch(error){
  count.textContent='Каталог недоступен';grid.innerHTML='<p class="case-catalog-loading">Не получилось загрузить кейсы. Проверь подключение к интернету и обнови страницу.</p>';console.error('CS2 case catalog:',error);
 }
}
renderCaseCatalog();
