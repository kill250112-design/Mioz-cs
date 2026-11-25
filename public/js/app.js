const cases=[
{id:'starter',name:'Стартовый кейс',price:100,icon:'📦',drops:[['P250 | Sand Dune','🟤',180],['MP9 | Storm','🌧️',240],['Galil AR | Camo','🪖',350],['AK-47 | Blue Laminate','🔷',950],['AWP | Dragon Fire','🐉',4200]]},
{id:'prime',name:'Прайм кейс',price:350,icon:'💎',drops:[['USP-S | Forest Leaves','🌲',600],['FAMAS | Neural Net','🧠',1100],['M4A4 | Howl','🐺',12000],['AWP | Asiimov','🟠',5000],['Karambit | Fade','🔪',24000]]},
{id:'legend',name:'Легендарный кейс',price:700,icon:'🔥',drops:[['Glock-18 | Water Elemental','💧',900],['AK-47 | Fire Serpent','🐍',18000],['AWP | Hyper Beast','🦖',8500],['Karambit | Crimson Web','🕸️',32000]]},
{id:'knife',name:'Ножевой кейс',price:1200,icon:'🔪',drops:[['Bayonet | Forest','🌳',6500],['Butterfly Knife | Waves','🦋',18000],['Karambit | Fade','🔪',24000],['Karambit | Ruby','💎',52000]]}
];
let balance=1000,inventory=[],rolling=false,pending=null,activeFilter='all';
try{const saved=JSON.parse(localStorage.getItem('cs2cases-save')||'null');if(saved&&Number.isFinite(saved.balance)&&Array.isArray(saved.inventory)){balance=Math.max(0,saved.balance);inventory=saved.inventory.filter(x=>x&&typeof x.name==='string'&&Number.isFinite(x.price)&&typeof x.icon==='string')}}catch(e){}
const $=id=>document.getElementById(id),money=n=>n.toLocaleString('ru-RU')+' ₽';
function saveGame(){try{localStorage.setItem('cs2cases-save',JSON.stringify({balance,inventory}))}catch(e){}}
function render(){
 saveGame();$('balance').textContent=money(balance);
 const count=$('home-inventory-count');if(count)count.textContent=inventory.length;
 const recent=$('recent-drop');if(recent)recent.textContent=inventory.length?inventory[inventory.length-1].name:'Пока нет дропов';
 $('cases').setAttribute('aria-live','polite');$('inventory').setAttribute('aria-live','polite');
 const visibleCases=cases.filter(c=>activeFilter==='all'||(activeFilter==='knife'?c.id==='knife':c.id!=='knife'));
 $('cases').innerHTML=visibleCases.map(c=>`<article class="case"><div class="art">${c.icon}</div><h3>${c.name}</h3><p class="muted">Содержит ${c.drops.length} возможных предметов</p><b class="price">${money(c.price)}</b><button class="open" data-case="${c.id}" ${balance<c.price?'disabled':''}>Открыть кейс</button></article>`).join('');
 $('inventory').innerHTML=inventory.length?inventory.map((x,i)=>`<article class="case"><div class="art">${x.icon}</div><h3>${x.name}</h3><b class="price">${money(x.price)}</b><button data-sell="${i}">Продать</button></article>`).join(''):'<p class="muted">Инвентарь пуст — открой кейс!</p>';
 document.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>openCase(b.dataset.case));
 document.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{balance+=inventory.splice(+b.dataset.sell,1)[0].price;render()});
}
function openCase(id){
 if(rolling)return;const c=cases.find(x=>x.id===id);if(balance<c.price)return;
 balance-=c.price;rolling=true;pending=c.drops[Math.floor(Math.random()*c.drops.length)];
 $('modal').classList.remove('hidden');$('dropName').textContent='Крутим кейс...';$('dropPrice').textContent='';$('claim').textContent='Ожидай...';
 const targetIndex=24,total=30;
 const items=Array.from({length:total},(_,i)=>i===targetIndex?pending:c.drops[Math.floor(Math.random()*c.drops.length)]);
 $('result').innerHTML='<div class="roulette-marker"></div><div class="spin-track">'+items.map(x=>'<span>'+x[1]+'</span>').join('')+'</div>';
 const track=$('result').querySelector('.spin-track');
 track.style.transform='translateX(0)';
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
   const card=track.querySelector('span'),step=card.getBoundingClientRect().width+12;
   track.style.transform='translateX('+($('result').clientWidth/2-(targetIndex*step+card.getBoundingClientRect().width/2))+'px)';
 }));
 setTimeout(()=>{rolling=false;$('result').innerHTML='<div class="drop-reveal">'+pending[1]+'</div>';$('dropName').textContent=pending[0];$('dropPrice').textContent=money(pending[2]);$('claim').textContent='Забрать в инвентарь';render()},4800);
 render();
}
$('claim').onclick=()=>{if(!pending||rolling)return;inventory.push({name:pending[0],icon:pending[1],price:pending[2]});pending=null;$('modal').classList.add('hidden');render()};
$('close').onclick=()=>{if(rolling)return;if(pending){inventory.push({name:pending[0],icon:pending[1],price:pending[2]});pending=null;render()}$('modal').classList.add('hidden')};

 document.querySelectorAll('.bottom-nav [data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));
 ['cases','inventory'].forEach(id=>$(id).classList.toggle('hidden',id!==tab));
 $('home-dashboard').classList.toggle('hidden',tab!=='cases');
 $('filter-row').classList.toggle('hidden',tab!=='cases');
 if(tab==='cases'||tab==='inventory')render();
}
document.querySelectorAll('.bottom-nav [data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{
 activeFilter=b.dataset.filter;
 document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));
 render();
});
render();
$('home-inventory').onclick=()=>showTab('inventory');
$('topup').onclick=()=>alert('Это демо-версия: реальные платежи пока не подключены.');
