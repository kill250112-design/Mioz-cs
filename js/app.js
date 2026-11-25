const cases=[
{id:'starter',name:'Стартовый кейс',price:100,icon:'📦',drops:[['P250 | Sand Dune','🟤',180,45],['MP9 | Storm','🌧️',240,28],['Galil AR | Camo','🪖',350,16],['AK-47 | Blue Laminate','🔷',950,9],['AWP | Dragon Fire','🐉',4200,2]]},
{id:'prime',name:'Прайм кейс',price:350,icon:'💎',drops:[['USP-S | Forest Leaves','🌲',600,42],['FAMAS | Neural Net','🧠',1100,28],['AWP | Asiimov','🟠',5000,15],['M4A4 | Howl','🐺',12000,12],['Karambit | Fade','🔪',24000,3]]},
{id:'legend',name:'Легендарный кейс',price:700,icon:'🔥',drops:[['Glock-18 | Water Elemental','💧',900,45],['AWP | Hyper Beast','🦖',8500,30],['AK-47 | Fire Serpent','🐍',18000,20],['Karambit | Crimson Web','🕸️',32000,5]]},
{id:'knife',name:'Ножевой кейс',price:1200,icon:'🔪',drops:[['Bayonet | Forest','🌳',6500,45],['Butterfly Knife | Waves','🦋',18000,30],['Karambit | Fade','🔪',24000,20],['Karambit | Ruby','💎',52000,5]]}
];
let balance=1000,inventory=[],rolling=false,pending=null,expandedCase=null;
try{const saved=JSON.parse(localStorage.getItem('cs2cases-save')||'null');if(saved&&Number.isFinite(saved.balance)&&Array.isArray(saved.inventory)){balance=Math.max(0,saved.balance);inventory=saved.inventory.filter(x=>x&&typeof x.name==='string'&&Number.isFinite(x.price)&&typeof x.icon==='string')}}catch(e){}
const $=id=>document.getElementById(id),money=n=>n.toLocaleString('ru-RU')+' ₽';
function saveGame(){try{localStorage.setItem('cs2cases-save',JSON.stringify({balance,inventory}))}catch(e){}}
function chooseDrop(c){let roll=Math.random()*100;for(const d of c.drops){roll-=d[3];if(roll<0)return d}return c.drops[c.drops.length-1]}
function render(){
 saveGame();$('balance').textContent=money(balance);
 const count=$('home-inventory-count');if(count)count.textContent=inventory.length;
 const recent=$('recent-drop');if(recent)recent.textContent=inventory.length?inventory[inventory.length-1].name:'Пока нет дропов';
 $('cases').setAttribute('aria-live','polite');$('inventory').setAttribute('aria-live','polite');
 $('cases').innerHTML=cases.map(c=>`<article class="case"><div class="art">${c.icon}</div><h3>${c.name}</h3><p class="muted">Содержит ${c.drops.length} возможных предметов</p><b class="price">${money(c.price)}</b><button class="open" data-case="${c.id}" ${balance<c.price?'disabled':''}>${expandedCase===c.id?'Скрыть содержимое':'Открыть'}</button>${expandedCase===c.id?`<div class="case-contents"><div class="contents-list">${c.drops.map(d=>`<div class="contents-row"><span>${d[1]} ${d[0]}</span><b>${d[3]}%</b><small>${money(d[2])}</small></div>`).join('')}</div><button class="open start-open" data-start="${c.id}" ${balance<c.price?'disabled':''}>Начать открытие · ${money(c.price)}</button></div>`:''}</article>`).join('');
 $('inventory').innerHTML=inventory.length?inventory.map((x,i)=>`<article class="case"><div class="art">${x.icon}</div><h3>${x.name}</h3><b class="price">${money(x.price)}</b><button data-sell="${i}">Продать</button></article>`).join(''):'<p class="muted">Инвентарь пуст — открой кейс!</p>';
 document.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>{expandedCase=expandedCase===b.dataset.case?null:b.dataset.case;render()});
 document.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>{const id=b.dataset.start;expandedCase=null;openCase(id)});
 document.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{balance+=inventory.splice(+b.dataset.sell,1)[0].price;render()});
}
function openCase(id){
 if(rolling)return;const c=cases.find(x=>x.id===id);if(!c||balance<c.price)return;
 balance-=c.price;rolling=true;pending=chooseDrop(c);
 $('modal').classList.remove('hidden');$('dropName').textContent='Крутим кейс...';$('dropPrice').textContent='';$('claim').textContent='Ожидай...';$('claim').disabled=true;
 const targetIndex=24,total=30;
 const items=Array.from({length:total},(_,i)=>i===targetIndex?pending:chooseDrop(c));
 $('result').innerHTML='<div class="roulette-marker"></div><div class="spin-track">'+items.map(x=>'<span>'+x[1]+'</span>').join('')+'</div>';
 const track=$('result').querySelector('.spin-track');track.style.transform='translateX(0)';
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  const card=track.querySelector('span'),step=card.getBoundingClientRect().width+12;
  const offset=$('result').clientWidth/2-(targetIndex*step+card.getBoundingClientRect().width/2);
  track.style.transform='translateX('+offset+'px)';
 }));
 render();
 setTimeout(()=>{rolling=false;$('result').innerHTML='<div class="drop-reveal">'+pending[1]+'</div>';$('dropName').textContent=pending[0];$('dropPrice').textContent='Цена: '+money(pending[2])+' · шанс выпадения: '+pending[3]+'%';$('claim').textContent='Забрать в инвентарь';$('claim').disabled=false;},4900);
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
