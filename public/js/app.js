let balance=1000,latestDrop='',inventory=[],caseCatalog=[],openedCases=0;
let upgradeSource='balance',upgradeItemIndex=-1,upgradeChance=10,upgradeMultiplier=5,upgradeBusy=false;
const CASE_PRICE=100;
try{const saved=JSON.parse(localStorage.getItem('cs2cases-save')||'null');if(saved&&Number.isFinite(saved.balance)){balance=Math.max(0,saved.balance);latestDrop=typeof saved.latestDrop==='string'?saved.latestDrop:'';inventory=Array.isArray(saved.inventory)?saved.inventory.filter(x=>x&&typeof x.name==='string'&&Number.isFinite(x.price)) : [];openedCases=Number.isInteger(saved.openedCases)&&saved.openedCases>=0?saved.openedCases:0}}catch(e){}
const $=id=>document.getElementById(id),money=n=>Math.round(n).toLocaleString('ru-RU')+' ₽';
function saveGame(){try{localStorage.setItem('cs2cases-save',JSON.stringify({balance,latestDrop,inventory,openedCases}))}catch(e){}}
function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function render(){
 saveGame();
 $('balance').textContent=money(balance);
 $('recent-drop').textContent=latestDrop||'Пока не открывал кейсы';
 renderInventory();
}
render();
function renderInventory(){
 renderUpgradeItemPicker();
 const grid=$('inventory-grid'),count=$('inventory-count');
 if(!grid||!count)return;
 count.textContent=inventory.length+' предметов';
 grid.innerHTML=inventory.length?inventory.map((item,index)=>({item,index})).reverse().map(({item,index})=>'<article class="inventory-item"><div class="inventory-item-art">'+(item.image?'<img src="'+escapeHTML(item.image)+'" alt="" onerror="this.remove()">':'')+'<span class="inventory-item-fallback">🔫</span></div><div class="inventory-item-info"><b>'+escapeHTML(item.name)+'</b><span>'+escapeHTML(item.rarity||'CS2 skin')+'</span><strong>≈ '+money(item.price)+'</strong></div><button class="inventory-sell-button" type="button" data-sell-item="'+index+'">ПРОДАТЬ · '+money(item.price)+'</button></article>').join(''):'<div class="inventory-empty"><span>🎒</span><b>Инвентарь пока пуст</b><p>Открой кейс и забери первый предмет — он появится здесь</p><button data-page="cases">Перейти к кейсам</button></div>';
 grid.querySelectorAll('[data-page="cases"]').forEach(button=>button.onclick=()=>showPage('cases'));
 grid.querySelectorAll('[data-sell-item]').forEach(button=>button.onclick=()=>{
  const index=Number(button.dataset.sellItem),item=inventory[index];
  if(!Number.isInteger(index)||!item||!Number.isFinite(item.price)||item.price<0)return;
  inventory.splice(index,1);balance+=item.price;render();
  const toast=document.createElement('div');toast.className='topup-toast';toast.textContent='Продано: +'+money(item.price);document.body.appendChild(toast);
  window.setTimeout(()=>toast.remove(),2200);
 });
}
function showPage(page){
 const isInventory=page==='inventory',isUpgrade=page==='upgrade';
 $('home-dashboard').classList.toggle('hidden',isInventory||isUpgrade);
 $('case-catalog').classList.toggle('hidden',isInventory||isUpgrade);
 $('inventory-page').classList.toggle('hidden',!isInventory);
 $('upgrade-page').classList.toggle('hidden',!isUpgrade);
 if(isUpgrade)updateUpgradePreview();
 document.querySelectorAll('.bottom-nav [data-page]').forEach(button=>button.classList.toggle('active',button.dataset.page===page));
 window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.bottom-nav [data-page]').forEach(button=>button.addEventListener('click',()=>showPage(button.dataset.page)));

const CASES_API='https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json';
const rarityWeights={'Consumer Grade':79.92,'Industrial Grade':15.98,'Mil-Spec Grade':3.2,'Restricted':0.64,'Classified':0.128,'Covert':0.0256,'Extraordinary':0.0064};
const rarityPrices={'Consumer Grade':[8,22],'Industrial Grade':[20,55],'Mil-Spec Grade':[45,120],'Restricted':[100,260],'Classified':[220,650],'Covert':[600,1800],'Extraordinary':[2500,9000]};
function normalizeDrop(item,forceRare=false){
 const rarity=item.rarity||item.rarity_name||{},rarityName=typeof rarity==='string'?rarity:(rarity.name||rarity.localized_name||(forceRare?'Extraordinary':'Mil-Spec Grade'));
 return {name:item.name||'Неизвестный предмет',image:item.image||'',rarity:rarityName,icon:'🔫'};
}
function getCaseDrops(crate){
 const normal=Array.isArray(crate.contains)?crate.contains:[];
 const rare=Array.isArray(crate.contains_rare)?crate.contains_rare:[];
 return [...normal.map(x=>normalizeDrop(x)),...rare.map(x=>normalizeDrop(x,true))].filter(x=>x.name!=='Неизвестный предмет');
}
function chooseDrop(crate,forceRare=false){
 const all=getCaseDrops(crate);if(!all.length)return null;
 const rare=(Array.isArray(crate.contains_rare)?crate.contains_rare:[]).map(x=>normalizeDrop(x,true));
 let drop;
 if(forceRare&&rare.length){drop={...rare[Math.floor(Math.random()*rare.length)]};}
 else{
  const groups={};
  all.forEach(item=>{const key=item.rarity in rarityWeights?item.rarity:'Mil-Spec Grade';(groups[key]??=[]).push(item)});
  const keys=Object.keys(groups),total=keys.reduce((sum,key)=>sum+rarityWeights[key],0);
  let roll=Math.random()*total,grade=keys[keys.length-1];
  for(const key of keys){roll-=rarityWeights[key];if(roll<=0){grade=key;break}}
  const pool=groups[grade]||all;drop={...pool[Math.floor(Math.random()*pool.length)]};
 }
 const range=rarityPrices[drop.rarity]||(forceRare?[2500,9000]:[45,120]);
 drop.price=Math.round(range[0]+Math.random()*(range[1]-range[0]));
 return drop;
}
function dropCard(drop,index,isWinner=false){
 return '<div class="cs2-reel-item'+(isWinner?' reel-winner':'')+'" data-reel-index="'+index+'"><div class="cs2-reel-art">'+(drop.image?'<img class="cs2-reel-image" src="'+escapeHTML(drop.image)+'" alt="" draggable="false" onerror="this.style.display=\'none\'">':'<span class="skin-fallback">🔫</span>')+'</div><b>'+escapeHTML(drop.name)+'</b></div>';
}
function showOpening(crate){
 const modal=document.createElement('div');modal.className='modal';modal.id='case-opening-modal';
 modal.innerHTML='<div class="dialog"><button class="close" id="opening-close" aria-label="Закрыть">×</button><div class="opening-top"><span class="opening-kicker">CS2 CASE OPENING</span><h2>'+escapeHTML(crate.name)+'</h2><p>Каждый 40-й кейс гарантирует редкий предмет, если он есть в кейсе</p></div><div class="opening-stage"><div class="cs2-reel"><div class="cs2-reel-track" id="reel-track"></div></div><div class="opening-pointer"></div><div class="case-burst" id="case-burst"><i class="burst-ring"></i><div class="burst-box">📦</div><span>ГОТОВИМ РУЛЕТКУ</span></div></div><div class="opening-status" id="opening-status"><i class="opening-pulse"></i>ПОДГОТОВКА</div><div id="opening-result" class="hidden"><h3 class="opening-drop-name" id="opening-drop-name"></h3><b class="opening-drop-price" id="opening-drop-price"></b><button class="opening-claim" id="opening-claim">Забрать предмет</button></div><div class="opening-footnote">Демо-режим · стоимость открытия '+money(CASE_PRICE)+'</div></div>';
 document.body.appendChild(modal);
 let closed=false,claimed=false;
 const close=()=>{if(closed)return;closed=true;modal.remove()};
 $('opening-close').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});
 openedCases++;
 const isFortieth=openedCases%40===0;
 saveGame();
 const winner=chooseDrop(crate,isFortieth);
 if(!winner){$('opening-status').textContent='В этом кейсе пока нет предметов.';return}
 const drops=getCaseDrops(crate),track=$('reel-track'),winnerIndex=38,reelLength=48;
 const reel=Array.from({length:reelLength},()=>drops[Math.floor(Math.random()*drops.length)]);
 reel[winnerIndex]=winner;
 track.innerHTML=reel.map((drop,index)=>dropCard(drop,index,index===winnerIndex)).join('');
 const status=$('opening-status'),burst=$('case-burst'),result=$('opening-result');
 const startSpin=()=>{
  if(closed)return;
  burst.classList.add('burst-out');status.innerHTML='<i class="opening-pulse"></i>РУЛЕТКА КРУТИТСЯ…';
  track.style.transition='none';track.style.transform='translate3d(0,0,0)';
  track.getBoundingClientRect();
  const stage=modal.querySelector('.opening-stage'),card=track.querySelector('[data-reel-index="'+winnerIndex+'"]');
  const stageRect=stage.getBoundingClientRect(),cardRect=card.getBoundingClientRect();
  const targetX=(stageRect.left+stageRect.width/2)-(cardRect.left+cardRect.width/2);
  const duration=6200;
  requestAnimationFrame(()=>{if(closed)return;track.style.transition='transform '+duration+'ms cubic-bezier(.08,.72,.08,1)';track.style.transform='translate3d('+targetX+'px,0,0)'});
  window.setTimeout(()=>{
   if(closed)return;
   // Keep the actual winning reel card visible; no separate image is layered over a different card.
   status.textContent='ВЫПАЛ ПРЕДМЕТ!';
   card.classList.add('reel-winner-final');
   $('opening-drop-name').textContent=winner.name;
   $('opening-drop-price').textContent='≈ '+money(winner.price);
   result.classList.remove('hidden');
   $('opening-claim').onclick=()=>{
    if(closed||claimed)return;claimed=true;
    latestDrop=winner.name;inventory.push({...winner});render();close();
   };
  },duration+180);
 };
 window.setTimeout(startSpin,650);
}
function paintCaseCatalog(data){
 const grid=$('case-catalog-grid'),count=$('case-count');if(!grid||!count)return;
 const catalog=data.filter(item=>item&&item.type==='Case'&&/case/i.test(item.name||'')&&getCaseDrops(item).length)
  .sort((a,b)=>String(b.first_sale_date||'').localeCompare(String(a.first_sale_date||'')));
 if(!catalog.length)return false;
 caseCatalog=catalog;count.textContent=caseCatalog.length+' кейсов';
 grid.innerHTML=caseCatalog.map((item,index)=>'<article class="case-catalog-card"><div class="case-catalog-art"><img src="'+escapeHTML(item.image||'')+'" alt="'+escapeHTML(item.name)+'" loading="lazy" decoding="async"><span class="case-image-fallback" aria-hidden="true">📦</span></div><div class="case-catalog-info"><h3>'+escapeHTML(item.name)+'</h3><span>'+(item.first_sale_date?new Date(item.first_sale_date+'T00:00:00').toLocaleDateString('ru-RU'):'CS2')+'</span></div><button class="case-open-button" data-open-case="'+index+'">ОТКРЫТЬ · '+money(CASE_PRICE)+'</button></article>').join('');
 grid.querySelectorAll('.case-catalog-art img').forEach(img=>img.addEventListener('error',()=>{img.style.display='none';img.nextElementSibling.style.display='grid'},{once:true}));
 grid.querySelectorAll('[data-open-case]').forEach(button=>button.onclick=()=>{if(balance<CASE_PRICE){alert('Недостаточно средств! Нужно '+money(CASE_PRICE)+'.');return}const crate=caseCatalog[Number(button.dataset.openCase)];balance-=CASE_PRICE;render();showOpening(crate)});
 return true;
}
async function renderCaseCatalog(){
 const grid=$('case-catalog-grid'),count=$('case-count');if(!grid||!count)return;
 const cacheName='cs2-case-catalog-v1';let hadCache=false;
 try{if('caches' in window){const cache=await caches.open(cacheName),cached=await cache.match(CASES_API);if(cached){const data=await cached.json();hadCache=paintCaseCatalog(data);}}}catch(error){console.warn('CS2 catalog cache:',error)}
 try{
  const response=await fetch(CASES_API,{cache:'force-cache'});if(!response.ok)throw new Error('Не удалось загрузить каталог');
  const data=await response.json();if(!paintCaseCatalog(data))throw new Error('Список кейсов пока недоступен');
  if('caches' in window){try{const cache=await caches.open(cacheName);await cache.put(CASES_API,new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}}));}catch(error){console.warn('Не удалось сохранить каталог:',error)}}
 }catch(error){if(!hadCache){count.textContent='Каталог недоступен';grid.innerHTML='<p class="case-catalog-loading">Не получилось загрузить кейсы. Проверь подключение к интернету и обнови страницу.</p>';}console.error('CS2 case catalog:',error)}
}
renderCaseCatalog();


// Virtual balance top-up (demo only; no real payments).
const TOPUP_AMOUNTS=[100,500,1000,10000,100000];
function openTopup(){
 if($('topup-modal'))return;
 const modal=document.createElement('div');modal.className='modal topup-modal';modal.id='topup-modal';
 modal.innerHTML='<section class="topup-dialog" role="dialog" aria-modal="true" aria-labelledby="topup-title"><button class="close topup-close" type="button" aria-label="Закрыть">×</button><span class="topup-kicker">CS2 WALLET</span><h2 id="topup-title">Пополнение баланса</h2><p>Выбери сумму виртуальных монет</p><div class="topup-options">'+TOPUP_AMOUNTS.map(amount=>'<button type="button" class="topup-option" data-topup="'+amount+'"><span>💰</span><b>+'+money(amount)+'</b></button>').join('')+'</div><small class="topup-note">Демо-пополнение — реальные деньги не списываются.</small></section>';
 document.body.appendChild(modal);
 const close=()=>modal.remove();
 modal.querySelector('.topup-close').addEventListener('click',close);
 modal.addEventListener('click',event=>{if(event.target===modal)close()});
 modal.querySelectorAll('[data-topup]').forEach(button=>button.addEventListener('click',()=>{
  const amount=Number(button.dataset.topup);if(!TOPUP_AMOUNTS.includes(amount))return;
  balance+=amount;render();close();
  const toast=document.createElement('div');toast.className='topup-toast';toast.textContent='Баланс пополнен на '+money(amount);document.body.appendChild(toast);
  window.setTimeout(()=>toast.remove(),2200);
 }));
}
$('topup-open')?.addEventListener('click',openTopup);


function renderUpgradeItemPicker(){
 const picker=$('upgrade-item-picker');if(!picker)return;
 if(!inventory.length){picker.innerHTML='<div class="upgrade-no-items">Инвентарь пуст. Сначала открой кейс и забери предмет.</div>';upgradeItemIndex=-1;return;}
 if(upgradeItemIndex<0||!inventory[upgradeItemIndex])upgradeItemIndex=inventory.length-1;
 picker.innerHTML=inventory.map((item,index)=>'<button type="button" class="upgrade-item-option'+(index===upgradeItemIndex?' selected':'')+'" data-upgrade-item="'+index+'">'+(item.image?'<img src="'+escapeHTML(item.image)+'" alt="">':'<span>🔫</span>')+'<b>'+escapeHTML(item.name)+'</b><strong>'+money(item.price)+'</strong></button>').join('');
 picker.querySelectorAll('[data-upgrade-item]').forEach(button=>button.onclick=()=>{upgradeItemIndex=Number(button.dataset.upgradeItem);renderUpgradeItemPicker();updateUpgradePreview()});
}
function getUpgradeStake(){
 if(upgradeSource==='item'){const item=inventory[upgradeItemIndex];return item?{value:item.price,item,index:upgradeItemIndex}:null;}
 const amount=Math.floor(Number($('upgrade-balance-amount')?.value));return Number.isFinite(amount)&&amount>0?{value:amount}:null;
}
function updateUpgradePreview(){
 const stake=getUpgradeStake(),value=stake?stake.value:0;
 $('upgrade-stake-preview').textContent=money(value);
 $('upgrade-win-preview').textContent=money(value*upgradeMultiplier);
 $('upgrade-chance-caption').textContent=upgradeChance+'%';
 $('upgrade-chance-fill').style.width=upgradeChance+'%';
 $('upgrade-start').disabled=upgradeBusy||!stake||(upgradeSource==='balance'&&value>balance);
 $('upgrade-start').textContent=upgradeBusy?'АПГРЕЙД…':'⚡ ЗАПУСТИТЬ АПГРЕЙД';
}
function setUpgradeSource(source){
 upgradeSource=source;
 document.querySelectorAll('[data-upgrade-source]').forEach(button=>button.classList.toggle('active',button.dataset.upgradeSource===source));
 $('upgrade-balance-source').classList.toggle('hidden',source!=='balance');
 $('upgrade-item-source').classList.toggle('hidden',source!=='item');
 updateUpgradePreview();
}
document.querySelectorAll('[data-upgrade-source]').forEach(button=>button.addEventListener('click',()=>setUpgradeSource(button.dataset.upgradeSource)));
document.querySelectorAll('[data-upgrade-chance]').forEach(button=>button.addEventListener('click',()=>{
 upgradeChance=Number(button.dataset.upgradeChance);
 document.querySelectorAll('[data-upgrade-chance]').forEach(x=>x.classList.toggle('active',x===button));updateUpgradePreview();
}));
document.querySelectorAll('[data-upgrade-multiplier]').forEach(button=>button.addEventListener('click',()=>{
 upgradeMultiplier=Number(button.dataset.upgradeMultiplier);
 document.querySelectorAll('[data-upgrade-multiplier]').forEach(x=>x.classList.toggle('active',x===button));updateUpgradePreview();
}));
$('upgrade-balance-amount')?.addEventListener('input',updateUpgradePreview);
document.querySelectorAll('[data-quick-amount]').forEach(button=>button.addEventListener('click',()=>{
 $('upgrade-balance-amount').value=button.dataset.quickAmount==='all'?Math.floor(balance):Number(button.dataset.quickAmount);updateUpgradePreview();
}));
$('upgrade-start')?.addEventListener('click',()=>{
 if(upgradeBusy)return;
 const stake=getUpgradeStake();if(!stake)return;
 if(upgradeSource==='balance'&&stake.value>balance){alert('На балансе недостаточно средств.');return;}
 upgradeBusy=true;updateUpgradePreview();
 if(upgradeSource==='balance')balance-=stake.value;else inventory.splice(stake.index,1);
 render();
 const modal=document.createElement('div');modal.className='modal upgrade-result-modal';
 modal.innerHTML='<section class="upgrade-result"><span class="upgrade-result-kicker">CS2 UPGRADE</span><div class="upgrade-result-orb">⚡</div><h2>ПРОВЕРКА ШАНСА</h2><div class="upgrade-result-percent">'+upgradeChance+'%</div><p>Цель: '+money(stake.value*upgradeMultiplier)+'</p><div class="upgrade-result-status">АПГРЕЙД ЗАПУЩЕН…</div></section>';
 document.body.appendChild(modal);
 const status=modal.querySelector('.upgrade-result-status'),won=Math.random()*100<upgradeChance;
 window.setTimeout(()=>{
  if(won){const reward=Math.round(stake.value*upgradeMultiplier);balance+=reward;status.textContent='УСПЕХ! +'+money(reward);status.classList.add('success');}
  else{status.textContent='НЕУДАЧА · СТАВКА ПОТЕРЯНА';status.classList.add('failure');}
  render();
  const close=document.createElement('button');close.className='upgrade-result-close';close.textContent='ПОНЯТНО';close.onclick=()=>{modal.remove();upgradeBusy=false;renderUpgradeItemPicker();updateUpgradePreview()};modal.querySelector('.upgrade-result').appendChild(close);
 },1500);
});


/* Screenshot-inspired target-based upgrader */
let upgradeTarget=null,upgradePickerMode='stake';
function renderUpgradeItemPicker(){
 const picker=$('upgrade-item-picker');if(!picker)return;
 if(!inventory.length){picker.innerHTML='<div class="upgrade-no-items">Инвентарь пуст — открой кейс и забери скин.</div>';upgradeItemIndex=-1;return;}
 if(upgradeItemIndex<0||!inventory[upgradeItemIndex])upgradeItemIndex=inventory.length-1;
 picker.innerHTML=inventory.map((item,index)=>'<button type="button" class="upgrade-item-option'+(index===upgradeItemIndex?' selected':'')+'" data-upgrade-item="'+index+'">'+(item.image?'<img src="'+escapeHTML(item.image)+'" alt="">':'<span>🔫</span>')+'<b>'+escapeHTML(item.name)+'</b><strong>'+money(item.price)+'</strong></button>').join('');
 picker.querySelectorAll('[data-upgrade-item]').forEach(button=>button.onclick=()=>{upgradeItemIndex=Number(button.dataset.upgradeItem);renderUpgradeItemPicker();updateUpgradePreview()});
}
function upgradeStake(){
 if(upgradeSource==='item'){const item=inventory[upgradeItemIndex];return item?{value:item.price,item,index:upgradeItemIndex}:null;}
 const value=Math.floor(Number($('upgrade-balance-amount')?.value));return Number.isFinite(value)&&value>0?{value}:null;
}
function upgradeTargetPool(){
 const all=[];caseCatalog.forEach(crate=>getCaseDrops(crate).forEach(item=>{
  const range=rarityPrices[item.rarity]||[45,120],price=Math.round((range[0]+range[1])/2);
  if(!all.some(x=>x.name===item.name))all.push({...item,price});
 }));
 return all;
}
function openUpgradePicker(mode){
 upgradePickerMode=mode;
 const picker=mode==='target'?$('upgrade-target-picker'):$('upgrade-item-picker');
 if(mode==='target'){
  const stake=upgradeStake(),wanted=stake?stake.value*upgradeMultiplier:0,pool=upgradeTargetPool().sort((a,b)=>Math.abs(a.price-wanted)-Math.abs(b.price-wanted)).slice(0,40);
  picker.classList.remove('hidden');
  picker.innerHTML=pool.length?pool.map((item,index)=>'<button type="button" class="upgrade-item-option" data-target-index="'+index+'">'+(item.image?'<img src="'+escapeHTML(item.image)+'" alt="">':'<span>🔫</span>')+'<b>'+escapeHTML(item.name)+'</b><strong>'+money(item.price)+'</strong></button>').join(''):'<div class="upgrade-no-items">Загружаем предметы кейсов…</div>';
  picker.querySelectorAll('[data-target-index]').forEach(button=>button.onclick=()=>{upgradeTarget=pool[Number(button.dataset.targetIndex)];picker.classList.add('hidden');updateUpgradePreview()});
 }else{picker.classList.toggle('hidden');}
}
function updateUpgradePreview(){
 const stake=upgradeStake(),value=stake?stake.value:0;
 $('upgrade-balance-display').textContent=money(balance);
 $('upgrade-stake-name').textContent=stake?(stake.item?stake.item.name:'Баланс'): 'Выбрать предмет или баланс';
 $('upgrade-stake-price').textContent=money(value);
 $('upgrade-stake-art').innerHTML=stake?.item?(stake.item.image?'<img src="'+escapeHTML(stake.item.image)+'" alt="">':'🔫'):'💰';
 $('upgrade-target-name').textContent=upgradeTarget?upgradeTarget.name:'Выберите цель';
 $('upgrade-target-price').textContent=upgradeTarget?money(upgradeTarget.price):'—';
 $('upgrade-target-art').innerHTML=upgradeTarget?(upgradeTarget.image?'<img src="'+escapeHTML(upgradeTarget.image)+'" alt="">':'🔫'):'⌁';
 $('upgrade-wheel-center').innerHTML=upgradeTarget?escapeHTML(upgradeTarget.name):'Выберите скин<br>для апгрейда';
 $('upgrade-wheel').style.setProperty('--chance',upgradeChance+'%');
 $('upgrade-start').disabled=upgradeBusy||!stake||!upgradeTarget||(upgradeSource==='balance'&&(value>balance||value<=0));
 $('upgrade-start').textContent=upgradeBusy?'АПГРЕЙД…':(!upgradeTarget?'⌁ ВЫБЕРИТЕ ЦЕЛЬ':'⚡ ЗАПУСТИТЬ АПГРЕЙД');
}
document.querySelectorAll('[data-upgrade-source]').forEach(button=>button.addEventListener('click',()=>setUpgradeSource(button.dataset.upgradeSource)));
document.querySelectorAll('[data-upgrade-chance]').forEach(button=>button.addEventListener('click',()=>{
 upgradeChance=Number(button.dataset.upgradeChance);document.querySelectorAll('[data-upgrade-chance]').forEach(x=>x.classList.toggle('active',x===button));updateUpgradePreview();
}));
document.querySelectorAll('[data-upgrade-multiplier]').forEach(button=>button.addEventListener('click',()=>{
 upgradeMultiplier=Number(button.dataset.upgradeMultiplier);document.querySelectorAll('[data-upgrade-multiplier]').forEach(x=>x.classList.toggle('active',x===button));upgradeTarget=null;updateUpgradePreview();
}));
$('upgrade-balance-amount')?.addEventListener('input',()=>{upgradeTarget=null;updateUpgradePreview()});
$('upgrade-stake-card')?.addEventListener('click',()=>{if(upgradeSource==='item')openUpgradePicker('stake');else $('upgrade-balance-amount').focus()});
$('upgrade-target-card')?.addEventListener('click',()=>openUpgradePicker('target'));
const oldUpgradeButton=$('upgrade-start');if(oldUpgradeButton){const fresh=oldUpgradeButton.cloneNode(true);oldUpgradeButton.replaceWith(fresh);fresh.addEventListener('click',()=>{
 if(upgradeBusy)return;const stake=upgradeStake();if(!stake||!upgradeTarget)return;
 if(upgradeSource==='balance'&&stake.value>balance){alert('На балансе недостаточно средств.');return;}
 upgradeBusy=true;if(upgradeSource==='balance')balance-=stake.value;else inventory.splice(stake.index,1);render();updateUpgradePreview();
 const modal=document.createElement('div');modal.className='modal upgrade-result-modal';modal.innerHTML='<section class="upgrade-result"><span class="upgrade-result-kicker">CS2 UPGRADER</span><div class="upgrade-result-orb">⚡</div><h2>ПРОВЕРКА ШАНСА</h2><div class="upgrade-result-percent">'+upgradeChance+'%</div><p>'+escapeHTML(upgradeTarget.name)+'</p><div class="upgrade-result-status">АПГРЕЙД ЗАПУЩЕН…</div></section>';document.body.appendChild(modal);
 const target={...upgradeTarget},status=modal.querySelector('.upgrade-result-status'),won=Math.random()*100<upgradeChance;
 window.setTimeout(()=>{if(won){inventory.push(target);latestDrop=target.name;status.textContent='УСПЕХ! ПРЕДМЕТ ПОЛУЧЕН';status.classList.add('success')}else{status.textContent='НЕУДАЧА · СТАВКА ПОТЕРЯНА';status.classList.add('failure')}render();const close=document.createElement('button');close.className='upgrade-result-close';close.textContent='ПОНЯТНО';close.onclick=()=>{modal.remove();upgradeBusy=false;updateUpgradePreview()};modal.querySelector('.upgrade-result').appendChild(close)},1500);
})}
