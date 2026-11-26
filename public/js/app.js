let balance=1000,caseCatalog=[],inventory=[],inventoryDescending=true,currentPage='cases';
const CASE_PRICE=100;
try{const saved=JSON.parse(localStorage.getItem('cs2cases-save')||'null');if(saved&&Number.isFinite(saved.balance)){balance=Math.max(0,saved.balance)}if(saved&&Array.isArray(saved.inventory)){inventory=saved.inventory.filter(x=>x&&typeof x.name==='string'&&Number.isFinite(x.price))}}catch(e){}
const $=id=>document.getElementById(id),money=n=>Math.round(n).toLocaleString('ru-RU')+' ₽';
function saveGame(){try{localStorage.setItem('cs2cases-save',JSON.stringify({balance,inventory}))}catch(e){}}
function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function skinImage(name){return 'https://raw.githubusercontent.com/renzynx/cs2-assets/main/static/panorama/images/econ/default_generated/'+name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')+'_light_png.png'}
function render(){
 saveGame();
 $('balance').textContent=money(balance);
 renderInventory();
}

function rarityClass(rarity){return String(rarity||'').toLowerCase().replace(/[^a-z]+/g,'-')}
function renderInventory(){
 const grid=$('inventory-grid');if(!grid)return;
 const total=inventory.reduce((s,x)=>s+Number(x.price||0),0);
 $('inventory-count').textContent=inventory.length;
 $('inventory-total').textContent=money(total);
 const best=inventory.reduce((a,x)=>!a||x.price>a.price?x:a,null);
 $('inventory-best').textContent=best?(best.price>=1000?(best.price/1000).toFixed(1).replace('.',',')+'к ₽':money(best.price)):'—';
 $('nav-inventory-count').textContent=inventory.length;
 if(!inventory.length){
  grid.innerHTML='<div class="inventory-empty"><div>🎒</div><h3>Здесь пока пусто</h3><p>Открой кейс — и твой первый скин появится здесь.</p><button type="button" data-go-cases>ОТКРЫТЬ КЕЙСЫ</button></div>';
  grid.querySelector('[data-go-cases]').onclick=()=>switchPage('cases');return;
 }
 const items=inventory.map((item,index)=>({...item,index})).sort((a,b)=>inventoryDescending?b.price-a.price:a.price-b.price);
 grid.innerHTML=items.map(item=>'<article class="inventory-card rarity-'+escapeHTML(rarityClass(item.rarity))+'"><div class="inventory-card-art">'+(item.image?'<img src="'+escapeHTML(item.image)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">':'<span>🔫</span>')+'<span class="inventory-card-tag">CS2 DROP</span></div><div class="inventory-card-info"><span class="inventory-rarity">'+escapeHTML(item.rarity||'Mil-Spec Grade')+'</span><h3>'+escapeHTML(item.name)+'</h3><strong class="inventory-card-price">'+money(item.price)+'</strong><button type="button" data-sell-item="'+item.index+'">ПРОДАТЬ ЗА '+money(item.price)+'</button></div></article>').join('');
 grid.querySelectorAll('[data-sell-item]').forEach(btn=>btn.onclick=()=>sellInventoryItem(Number(btn.dataset.sellItem)));
}
function sellInventoryItem(index){
 const item=inventory[index];if(!item)return;
 balance+=Number(item.price)||0;inventory.splice(index,1);render();saveGame();
}
function switchPage(page){
 currentPage=page==='inventory'?'inventory':'cases';
 $('case-catalog').classList.toggle('hidden',currentPage!=='cases');
 $('inventory-page').classList.toggle('hidden',currentPage!=='inventory');
 document.querySelectorAll('.bottom-nav [data-page]').forEach(btn=>btn.classList.toggle('active',btn.dataset.page===currentPage));
 window.scrollTo({top:0,behavior:'smooth'});
 if(currentPage==='inventory')renderInventory();
}
document.querySelectorAll('.bottom-nav [data-page]').forEach(btn=>btn.addEventListener('click',()=>switchPage(btn.dataset.page)));
$('inventory-sort').onclick=()=>{inventoryDescending=!inventoryDescending;$('inventory-sort').textContent=inventoryDescending?'СНАЧАЛА ДОРОГИЕ ↕':'СНАЧАЛА ДЕШЁВЫЕ ↕';renderInventory()};

$('topup').onclick=()=>alert('Это демо-версия: реальные платежи пока не подключены.');
render();

const CASES_API='https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json';
const rarityWeights={'Mil-Spec Grade':79.92,'Restricted':15.98,'Classified':3.2,'Covert':0.64,'Extraordinary':0.26};
const rarityPrices={'Consumer Grade':[8,22],'Industrial Grade':[20,55],'Mil-Spec Grade':[45,120],'Restricted':[100,260],'Classified':[220,650],'Covert':[600,1800],'Extraordinary':[2500,9000]};
function normalizeDrop(item){
 const rarity=item.rarity||item.rarity_name||{},rarityName=typeof rarity==='string'?rarity:(rarity.name||rarity.localized_name||'Mil-Spec Grade');
 return {name:item.name||'Неизвестный предмет',image:item.image||'',rarity:rarityName,icon:'🔫'};
}
function getCaseDrops(crate){
 const normal=Array.isArray(crate.contains)?crate.contains:[];
 const rare=Array.isArray(crate.contains_rare)?crate.contains_rare:[];
 return [...normal.map(normalizeDrop),...rare.filter(x=>x&&x.name).map(x=>({...normalizeDrop(x),rarity:'Extraordinary'}))];
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
 modal.innerHTML='<div class="dialog"><button class="close" id="opening-close" aria-label="Закрыть">×</button><div class="opening-top"><span class="opening-kicker">CS2 CASE OPENING</span><h2>'+escapeHTML(crate.name)+'</h2><p>Удачи! Посмотрим, что внутри.</p></div><div class="opening-stage"><div class="cs2-reel"><div class="cs2-reel-track" id="reel-track"></div></div><div class="opening-pointer"></div><div class="case-burst" id="case-burst"><i class="burst-ring"></i><div class="burst-box">📦</div><span>ОТКРЫВАЕМ КЕЙС</span></div></div><div class="opening-status" id="opening-status"><i class="opening-pulse"></i>ПОДГОТОВКА</div><div id="opening-result" class="hidden"><h3 class="opening-drop-name" id="opening-drop-name"></h3><b class="opening-drop-price" id="opening-drop-price"></b><button class="opening-claim" id="opening-claim">Завершить</button></div><div class="opening-footnote">Демо-режим · стоимость открытия '+money(CASE_PRICE)+'</div></div>';
 document.body.appendChild(modal);
 let closed=false,animation=null;
 const close=()=>{closed=true;if(animation)animation.cancel();modal.remove()};
 $('opening-close').onclick=close;
 modal.addEventListener('click',e=>{if(e.target===modal)close()});
 const winner=chooseDrop(crate);if(!winner){$('opening-status').textContent='В этом кейсе пока нет списка предметов.';return}
 const drops=getCaseDrops(crate),track=$('reel-track'),winnerIndex=52;
 const reel=Array.from({length:70},(_,i)=>i===winnerIndex?winner:drops[Math.floor(Math.random()*drops.length)]);
 track.innerHTML=reel.map(dropCard).join('');
 const status=$('opening-status'),burst=$('case-burst'),result=$('opening-result');
 function revealWinner(){
  if(closed||!modal.isConnected)return;
  inventory.push({...winner,obtainedAt:Date.now(),caseName:crate.name});
  render();saveGame();
  status.textContent='ВЫПАЛ ПРЕДМЕТ!';
  $('opening-drop-name').textContent=winner.name;
  $('opening-drop-price').textContent='≈ '+money(winner.price);
  result.classList.remove('hidden');
  const stage=modal.querySelector('.opening-stage');
  stage.insertAdjacentHTML('beforeend','<div class="opening-winner">'+(winner.image?'<img class="reveal-image" src="'+escapeHTML(winner.image)+'" alt="'+escapeHTML(winner.name)+'" onerror="this.style.display=\'none\'">':'<span class="burst-box">🔫</span>')+'</div>');
  track.children[winnerIndex].classList.add('is-winning');
  $('opening-claim').onclick=()=>{close();switchPage('inventory')};
 }
 window.setTimeout(()=>{
  if(closed||!modal.isConnected)return;
  burst.classList.add('burst-out');
  status.innerHTML='<i class="opening-pulse"></i>РУЛЕТКА КРУТИТСЯ…';
  requestAnimationFrame(()=>{
   requestAnimationFrame(()=>{
    if(closed||!modal.isConnected)return;
    const stage=modal.querySelector('.opening-stage');
    const winningCard=track.children[winnerIndex];
    // Reset to the true starting point, then animate the actual reel element.
    track.style.transform='translate3d(0px,0,0)';
    const stageRect=stage.getBoundingClientRect();
    const cardRect=winningCard.getBoundingClientRect();
    const distance=(stageRect.left+stageRect.width/2)-(cardRect.left+cardRect.width/2);
    const endTransform='translate3d('+distance+'px,0,0)';
    if(typeof track.animate==='function'){
     animation=track.animate(
      [{transform:'translate3d(0px,0,0)'},{transform:endTransform}],
      {duration:6500,easing:'cubic-bezier(.08,.72,.08,1)',fill:'forwards'}
     );
     animation.onfinish=()=>{
      if(closed)return;
      track.style.transform=endTransform;
      animation.cancel();
      revealWinner();
     };
    }else{
     track.style.transition='none';
     void track.offsetWidth;
     track.style.transition='transform 6.5s cubic-bezier(.08,.72,.08,1)';
     track.style.transform=endTransform;
     window.setTimeout(()=>{track.style.transition='none';revealWinner()},6700);
    }
   });
  });
 },800);
}

function renderCaseDetails(index){
 const crate=caseCatalog[index];if(!crate)return;
 const grid=$('case-catalog-grid'),drops=getCaseDrops(crate);
 const groups={};
 drops.forEach(drop=>{const key=drop.rarity==='Extraordinary'?'Extraordinary':(drop.rarity in rarityWeights?drop.rarity:'Mil-Spec Grade');(groups[key]??=[]).push(drop)});
 const present=Object.keys(groups),total=present.reduce((sum,key)=>sum+rarityWeights[key],0)||1;
 const chanceFor=drop=>{const key=drop.rarity==='Extraordinary'?'Extraordinary':(drop.rarity in rarityWeights?drop.rarity:'Mil-Spec Grade');return (rarityWeights[key]/total/groups[key].length*100)};
 const itemRows=drops.map(drop=>'<div class="contents-row"><span>'+(drop.image?'<img class="skin-image" src="'+escapeHTML(drop.image)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">':'<span class="skin-image-fallback">🔫</span>')+'<span class="skin-name">'+escapeHTML(drop.name)+'</span></span><b>'+chanceFor(drop).toFixed(4).replace('.',',')+'%</b></div>').join('');
 grid.innerHTML='<article class="case-detail"><button type="button" class="detail-back" id="case-detail-back">← НАЗАД К КЕЙСАМ</button><div class="detail-art">'+(crate.image?'<img src="'+escapeHTML(crate.image)+'" alt="'+escapeHTML(crate.name)+'" style="max-width:100%;max-height:100%;object-fit:contain" onerror="this.style.display=\'none\'">':'📦')+'</div><h2>'+escapeHTML(crate.name)+'</h2><p class="muted">Внутри '+drops.length+' предметов. Ниже показаны шансы выпадения каждого предмета.</p><button type="button" class="case-open-button detail-open" id="detail-open-case">ОТКРЫТЬ КЕЙС · '+money(CASE_PRICE)+'</button><h3 class="odds-title">ВСЕ ПРЕДМЕТЫ И ШАНСЫ</h3><div class="contents-list">'+itemRows+'</div></article>';
 $('case-detail-back').onclick=()=>renderCaseCatalog();
 $('detail-open-case').onclick=()=>{if(balance<CASE_PRICE){alert('Недостаточно средств! Нужно '+money(CASE_PRICE)+'.');return}balance-=CASE_PRICE;render();showOpening(crate)};
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
  grid.querySelectorAll('[data-open-case]').forEach(button=>button.onclick=()=>renderCaseDetails(Number(button.dataset.openCase)));
 }catch(error){
  count.textContent='Каталог недоступен';grid.innerHTML='<p class="case-catalog-loading">Не получилось загрузить кейсы. Проверь подключение к интернету и обнови страницу.</p>';console.error('CS2 case catalog:',error);
 }
}
renderCaseCatalog();
