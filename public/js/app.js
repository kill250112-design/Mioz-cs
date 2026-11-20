const cases=[
{id:'starter',name:'Стартовый кейс',price:100,icon:'📦',drops:[['P250 | Sand Dune','🟤',180],['MP9 | Storm','🌧️',240],['Galil AR | Camo','🪖',350],['AK-47 | Blue Laminate','🔷',950],['AWP | Dragon Fire','🐉',4200]]},
{id:'prime',name:'Прайм кейс',price:350,icon:'💎',drops:[['USP-S | Forest Leaves','🌲',600],['FAMAS | Neural Net','🧠',1100],['M4A4 | Howl','🐺',12000],['AWP | Asiimov','🟠',5000],['Karambit | Fade','🔪',24000]]},
{id:'legend',name:'Легендарный кейс',price:700,icon:'🔥',drops:[['Glock-18 | Water Elemental','💧',900],['AK-47 | Fire Serpent','🐍',18000],['AWP | Hyper Beast','🦖',8500],['Karambit | Crimson Web','🕸️',32000]]},
{id:'knife',name:'Ножевой кейс',price:1200,icon:'🔪',drops:[['Bayonet | Forest','🌳',6500],['Butterfly Knife | Waves','🦋',18000],['Karambit | Fade','🔪',24000],['Karambit | Ruby','💎',52000]]}
];
let balance=1000,inventory=[],rolling=false,pending=null,battleSelection=[],battleRunning=false,activeFilter='all';
try{const saved=JSON.parse(localStorage.getItem('cs2cases-save')||'null');if(saved&&Number.isFinite(saved.balance)&&Array.isArray(saved.inventory)){balance=Math.max(0,saved.balance);inventory=saved.inventory.filter(x=>x&&typeof x.name==='string'&&Number.isFinite(x.price)&&typeof x.icon==='string')}}catch(e){}
const $=id=>document.getElementById(id),money=n=>n.toLocaleString('ru-RU')+' ₽';
function saveGame(){try{localStorage.setItem('cs2cases-save',JSON.stringify({balance,inventory}))}catch(e){}}
function render(){
 saveGame();$('balance').textContent=money(balance);$('count').textContent=inventory.length;
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
 $('modal').classList.remove('hidden');$('dropName').textContent='Крутим рулетку...';$('dropPrice').textContent='';
 $('result').innerHTML='<div class="spin-track">'+Array.from({length:15},(_,i)=>'<span>'+c.drops[i%c.drops.length][1]+'</span>').join('')+'</div>';
 setTimeout(()=>{rolling=false;$('result').textContent=pending[1];$('dropName').textContent=pending[0];$('dropPrice').textContent=money(pending[2]);$('claim').textContent='Забрать в инвентарь';render()},2900);render();
}
$('claim').onclick=()=>{if(!pending||rolling)return;inventory.push({name:pending[0],icon:pending[1],price:pending[2]});pending=null;$('modal').classList.add('hidden');render()};
$('close').onclick=()=>{if(rolling)return;if(pending){inventory.push({name:pending[0],icon:pending[1],price:pending[2]});pending=null;render()}$('modal').classList.add('hidden')};
function renderBattle(){
 const cost=battleSelection.reduce((s,id)=>s+cases.find(c=>c.id===id).price,0);
 $('battle-count').textContent=battleSelection.length+' / 3';$('battle-cost').textContent=money(cost);
 $('battle-cases').innerHTML=cases.map(c=>{const yes=battleSelection.includes(c.id);return `<article class="case battle-case ${yes?'selected':''}"><div class="art">${c.icon}</div><h3>${c.name}</h3><p class="muted">${c.drops.length} предметов в пуле</p><b class="price">${money(c.price)}</b><button class="choose-case" data-pick="${c.id}" ${battleRunning||(!yes&&battleSelection.length>=3)?'disabled':''}>${yes?'✓ Выбран':'＋ Добавить'}</button></article>`}).join('');
 $('battle-cases').querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const id=b.dataset.pick;battleSelection=battleSelection.includes(id)?battleSelection.filter(x=>x!==id):[...battleSelection,id];$('battle-result').classList.add('hidden');renderBattle()});
 $('start-battle').disabled=!battleSelection.length||battleRunning||cost>balance;
 $('start-battle').title=cost>balance?'Недостаточно средств':battleSelection.length?'Начать батл':'Сначала выбери хотя бы один кейс';
}
function startBattle(){
 if(battleRunning||!battleSelection.length)return;
 const cost=battleSelection.reduce((s,id)=>s+cases.find(c=>c.id===id).price,0);
 if(balance<cost){$('battle-result').classList.remove('hidden');$('battle-result').innerHTML='<h3>Не хватает баланса</h3><p>Продай предметы из инвентаря или открой обычные кейсы.</p>';return}
 balance-=cost;battleRunning=true;render();
 const rounds=battleSelection.map(id=>{const c=cases.find(x=>x.id===id);return {c,p:c.drops[Math.floor(Math.random()*c.drops.length)],b:c.drops[Math.floor(Math.random()*c.drops.length)]}});
 const p=rounds.reduce((s,r)=>s+r.p[2],0),b=rounds.reduce((s,r)=>s+r.b[2],0);
 $('battle-result').classList.remove('hidden');
 $('battle-result').innerHTML='<div class="battle-versus"><div><span>🧑</span><b>ТЫ</b><strong>'+money(p)+'</strong></div><em>VS</em><div><span>🤖</span><b>БОТ</b><strong>'+money(b)+'</strong></div></div><div class="round-list">'+rounds.map((r,i)=>'<article><small>РАУНД '+(i+1)+' · '+r.c.name+'</small><div class="round-players"><span>Ты: '+r.p[1]+' '+r.p[0]+' <b>'+money(r.p[2])+'</b></span><span>Бот: '+r.b[1]+' '+r.b[0]+' <b>'+money(r.b[2])+'</b></span></div></article>').join('')+'</div><h2 class="battle-winner">'+(p>b?'🏆 Ты победил!':p<b?'🤖 Победил бот':'🤝 Ничья!')+'</h2><p class="muted">'+(p>b?'Дропы батла отправлены в твой инвентарь.':'Попробуй ещё раз — удача может улыбнуться!')+'</p><button id="again-battle">Сыграть ещё раз</button>';
 if(p>b)rounds.forEach(r=>inventory.push({name:r.p[0],icon:r.p[1],price:r.p[2]}));
 battleRunning=false;$('again-battle').onclick=()=>{$('battle-result').classList.add('hidden');renderBattle()};render();
}
$('start-battle').onclick=startBattle;
function showTab(tab){
 document.querySelectorAll('.bottom-nav [data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));
 ['cases','inventory','battle'].forEach(id=>$(id).classList.toggle('hidden',id!==tab));
 $('filter-row').classList.toggle('hidden',tab!=='cases');
 if(tab==='battle')renderBattle();
 if(tab==='cases'||tab==='inventory')render();
}
document.querySelectorAll('.bottom-nav [data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{
 activeFilter=b.dataset.filter;
 document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));
 render();
});
render();