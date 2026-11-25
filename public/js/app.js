let cases=[];
const CASE_API='https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json';
const CASE_PRICES_USD={
'Fever Case':0.35,'Gallery Case':0.40,'Kilowatt Case':0.05,'Revolution Case':0.08,'Recoil Case':0.12,'Dreams & Nightmares Case':0.51,'Snakebite Case':0.19,'Fracture Case':0.20,'Clutch Case':0.26,'Prisma 2 Case':0.60,'Prisma Case':0.55,'Danger Zone Case':0.62,'Horizon Case':0.89,'Spectrum 2 Case':2,'Spectrum Case':2.40,'Gamma 2 Case':1.99,'Gamma Case':2,'Chroma 3 Case':2.19,'Chroma 2 Case':2.55,'Chroma Case':3.34,'Glove Case':6.03,'Operation Hydra Case':19,'Operation Broken Fang Case':3.94,'Operation Riptide Case':4.49,'Operation Wildfire Case':1.88,'Operation Breakout Weapon Case':5.39,'Operation Phoenix Weapon Case':2.49,'Operation Vanguard Weapon Case':3.26,'Operation Bravo Case':46.46,'CS:GO Weapon Case':80.99,'CS:GO Weapon Case 2':14.77,'CS:GO Weapon Case 3':9.84,'eSports 2013 Case':35.54,'eSports 2013 Winter Case':8.67,'eSports 2014 Summer Case':8.50,'Winter Offensive Weapon Case':8.20,'Huntsman Weapon Case':6.31,'Falchion Case':1,'Shadow Case':1.02,'Revolver Case':1.80,'Shattered Web Case':2.90,'CS20 Case':0.49
};
const USD_RUB=80;
const rarityWeight=r=>({'Mil-Spec Grade':79.92,'Restricted':15.98,'Classified':3.2,'Covert':0.64}[r]||0.26);
// Ориентировочные цены предметов в рублях: целые числа, одинаковые для одного и того же скина.
function itemMarketPrice(name,rarity){
 const ranges={'Mil-Spec Grade':[15,180],'Restricted':[70,650],'Classified':[250,2200],'Covert':[900,9000],'Special':[2500,30000]};
 const [min,max]=ranges[rarity]||ranges.Special;
 let hash=0;for(let i=0;i<name.length;i++)hash=(hash*31+name.charCodeAt(i))>>>0;
 return Math.round((min+(hash%10000)/9999*(max-min))/1)*1;
}
async function loadCases(){
 try{
  const response=await fetch(CASE_API);if(!response.ok)throw new Error('API');
  const data=await response.json();
  const wantedCases=['Dreams & Nightmares Case','Revolution Case','Kilowatt Case','Gallery Case','Fever Case'];
  cases=data.filter(c=>c.type==='Case'&&wantedCases.includes(c.name)&&Array.isArray(c.contains)&&c.contains.length).map((c,i)=>{
   const regular=c.contains.map(x=>[x.name,'',itemMarketPrice(x.name,x.rarity?.name),rarityWeight(x.rarity?.name),x.image,x.rarity?.color]);
   const rare=(c.contains_rare||[]).map(x=>[x.name,'',itemMarketPrice(x.name,'Special'),0.26,x.image,'#e4ae39']);
   const drops=[...regular,...rare];
   const total=drops.reduce((s,d)=>s+d[3],0);drops.forEach(d=>d[3]=d[3]/total*100);
   // В списке кейса дорогие скины сверху, дешёвые снизу.
   drops.sort((a,b)=>b[2]-a[2]);
   const usd=CASE_PRICES_USD[c.name];
   return {id:'case-'+c.id,name:c.name,price:Math.round((usd||0.5)*USD_RUB),icon:'',image:c.image,drops};
  });
  const order=['Dreams & Nightmares Case','Revolution Case','Kilowatt Case','Gallery Case','Fever Case'];
  cases.sort((a,b)=>order.indexOf(a.name)-order.indexOf(b.name));
  render();
 }catch(e){console.error('Не удалось загрузить каталог кейсов CS2',e)}
}

let balance=1000,inventory=[],rolling=false,pending=null,expandedCase=null;
try{const saved=JSON.parse(localStorage.getItem('cs2cases-save')||'null');if(saved&&Number.isFinite(saved.balance)&&Array.isArray(saved.inventory)){balance=Math.max(0,saved.balance);inventory=saved.inventory.filter(x=>x&&typeof x.name==='string'&&Number.isFinite(x.price)&&typeof x.icon==='string')}}catch(e){}
const $=id=>document.getElementById(id),money=n=>n.toLocaleString('ru-RU')+' ₽';
function formatChance(value){return (value<1?value.toFixed(2):Math.round(value))+'%';}
function saveGame(){try{localStorage.setItem('cs2cases-save',JSON.stringify({balance,inventory}))}catch(e){}}
function skinImage(name){const wear=name.includes('Karambit')||name.includes('Bayonet')||name.includes('Butterfly Knife')?'Factory New':'Field-Tested';return 'https://cdn2.csgo.com/item/'+encodeURIComponent(name+' ('+wear+')')+'/512.png'}
function itemVisual(d,cls='skin-image'){return '<img class="'+cls+'" src="'+(d[4]||skinImage(d[0]))+'" alt="'+d[0]+'" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><span class="skin-fallback" style="display:none">'+d[1]+'</span>'}
function chooseDrop(c){let roll=Math.random()*100;for(const d of c.drops){roll-=d[3];if(roll<0)return d}return c.drops[c.drops.length-1]}
function render(){
 saveGame();$('balance').textContent=money(balance);
 const count=$('home-inventory-count');if(count)count.textContent=inventory.length;
 const recent=$('recent-drop');if(recent)recent.textContent=inventory.length?inventory[inventory.length-1].name:'Пока нет дропов';
 $('cases').setAttribute('aria-live','polite');$('inventory').setAttribute('aria-live','polite');
 const selected=cases.find(c=>c.id===expandedCase);
 const sortedDrops=selected?[...selected.drops].sort((a,b)=>Number(b[2])-Number(a[2])):[];
 $('cases').innerHTML=selected?`<section class="case-detail"><button class="detail-back" data-back>← Все кейсы</button><div class="detail-art">${selected.icon}</div><h2>${selected.name}</h2><p class="muted">Стоимость открытия: ${money(selected.price)}</p><button type="button" class="open detail-open" data-open="${selected.id}">Открыть · ${money(selected.price)}</button><h3 class="odds-title">Содержимое кейса и шансы</h3><div class="case-contents"><div class="contents-list">${sortedDrops.map(d=>`<div class="contents-row"><span>${itemVisual(d)} <span class="skin-name">${d[0]}</span></span><b>Шанс: ${${formatChance(d[3])}</b><small>Цена предмета: ${money(d[2])}</small></div>`).join('')}</div></div></section>`:cases.map(c=>`<article class="case case-tile" data-case="${c.id}"><div class="art">${c.image?`<img src="${c.image}" alt="${c.name}" style="width:100%;height:100%;object-fit:contain">`:c.icon}</div><h3>${c.name}</h3><p class="muted">Содержит ${c.drops.length} возможных предметов</p><b class="price">${money(c.price)}</b><button class="open" data-case="${c.id}">Посмотреть кейс</button></article>`).join('');
 $('inventory').innerHTML=inventory.length?inventory.map((x,i)=>`<article class="case"><div class="art">${itemVisual([x.name,x.icon,x.price,0])}</div><h3>${x.name}</h3><b class="price">${money(x.price)}</b><button data-sell="${i}">Продать</button></article>`).join(''):'<p class="muted">Инвентарь пуст — открой кейс!</p>';
 document.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>{expandedCase=b.dataset.case;render()});
 document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openCase(b.dataset.open));
 document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>{expandedCase=null;render()});
 document.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{balance+=inventory.splice(+b.dataset.sell,1)[0].price;render()});
}
function openCase(id){
 if(rolling)return;const c=cases.find(x=>x.id===id);if(!c)return;if(balance<c.price){alert('Недостаточно монет для открытия кейса. Пополни баланс.');return;}
 balance-=c.price;rolling=true;pending=chooseDrop(c);
 saveGame();$('balance').textContent=money(balance);
 $('modal').classList.remove('hidden');$('dropName').textContent='Крутим кейс...';$('dropPrice').textContent='';$('claim').textContent='Ожидай...';$('claim').disabled=true;
 const targetIndex=24,total=30;
 const items=Array.from({length:total},(_,i)=>i===targetIndex?pending:chooseDrop(c));
 $('result').innerHTML='<div class="roulette-marker"></div><div class="spin-track">'+items.map(x=>'<span class="roulette-item"><img src="'+(x[4]||skinImage(x[0]))+'" alt="'+x[0]+'" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'"><i style="display:none">'+x[1]+'</i></span>').join('')+'</div>';
 const track=$('result').querySelector('.spin-track');track.style.animation='none';track.style.transition='none';track.style.transform='translateX(0)';
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  const card=track.querySelector('span'),step=card.getBoundingClientRect().width+12;
  const offset=$('result').clientWidth/2-(targetIndex*step+card.getBoundingClientRect().width/2);
  track.style.transition='transform 4.2s cubic-bezier(.08,.72,.12,1)';
  track.style.transform='translateX('+offset+'px)';
 }));
 setTimeout(()=>{rolling=false;$('result').innerHTML='<div class="drop-reveal">'+itemVisual(pending,'reveal-image')+'</div>';$('dropName').textContent=pending[0];$('dropPrice').textContent='Цена: '+money(pending[2])+' · шанс выпадения: '+pending[3]+'%';$('claim').textContent='Забрать в инвентарь';$('claim').disabled=false;},4400);
}
$('claim').onclick=()=>{if(!pending||rolling)return;inventory.push({name:pending[0],icon:pending[1],price:pending[2]});pending=null;$('modal').classList.add('hidden');render()};
$('close').onclick=()=>{if(rolling)return;if(pending){inventory.push({name:pending[0],icon:pending[1],price:pending[2]});pending=null;render()}$('modal').classList.add('hidden')};
function showTab(tab){
 document.querySelectorAll('.bottom-nav [data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));
 $('cases').classList.toggle('hidden',tab!=='cases');$('inventory').classList.toggle('hidden',tab!=='inventory');
 $('home-dashboard').classList.toggle('hidden',tab!=='cases');
 document.querySelector('.cases-heading').classList.toggle('hidden',tab!=='cases');
 if(tab==='cases'||tab==='inventory')render();
}
document.querySelectorAll('.bottom-nav [data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
$('logo-home')?.addEventListener('click',()=>showTab('cases'));
$('home-inventory').onclick=()=>showTab('inventory');
$('topup').onclick=()=>alert('Это демо-версия: реальные платежи пока не подключены.');
render();

loadCases();
