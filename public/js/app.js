let balance=1000,inventory=[];
try{const saved=JSON.parse(localStorage.getItem('cs2cases-save')||'null');if(saved&&Number.isFinite(saved.balance)&&Array.isArray(saved.inventory)){balance=Math.max(0,saved.balance);inventory=saved.inventory.filter(x=>x&&typeof x.name==='string'&&Number.isFinite(x.price)&&typeof x.icon==='string')}}catch(e){}
const $=id=>document.getElementById(id),money=n=>n.toLocaleString('ru-RU')+' ₽';
function saveGame(){try{localStorage.setItem('cs2cases-save',JSON.stringify({balance,inventory}))}catch(e){}}
function skinImage(name){return 'https://raw.githubusercontent.com/renzynx/cs2-assets/main/static/panorama/images/econ/default_generated/'+name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')+'_light_png.png'}
function itemVisual(x){return '<img class="skin-image" src="'+skinImage(x.name)+'" alt="'+x.name+'" onerror="this.remove();this.nextElementSibling.style.display=\'grid\'"><span class="skin-fallback" style="display:none">'+(x.icon||'🔫')+'</span>'}
function render(){
 saveGame();$('balance').textContent=money(balance);
 $('home-inventory-count').textContent=inventory.length;
 $('recent-drop').textContent=inventory.length?inventory[inventory.length-1].name:'Пока нет предметов';
 $('inventory').innerHTML=inventory.length?inventory.map((x,i)=>'<article class="case"><div class="art">'+itemVisual(x)+'</div><h3>'+x.name+'</h3><b class="price">'+money(x.price)+'</b><button data-sell="'+i+'">Продать</button></article>').join(''):'<p class="muted">Инвентарь пока пуст.</p>';
 document.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{balance+=inventory.splice(+b.dataset.sell,1)[0].price;render()});
}
$('home-inventory').onclick=()=>document.getElementById('inventory').scrollIntoView({behavior:'smooth',block:'start'});
$('topup').onclick=()=>alert('Это демо-версия: реальные платежи пока не подключены.');
render();