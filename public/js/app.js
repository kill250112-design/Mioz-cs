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
renderCaseCatalog();

const CASES_API='https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json';
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
async function renderCaseCatalog(){
 const grid=$('case-catalog-grid'),count=$('case-count');
 if(!grid||!count)return;
 try{
  const response=await fetch(CASES_API,{cache:'no-cache'});
  if(!response.ok)throw new Error('Не удалось загрузить каталог');
  const data=await response.json();
  const cases=data.filter(item=>item&&item.type==='Case'&&/case/i.test(item.name||''))
   .sort((a,b)=>String(b.first_sale_date||'').localeCompare(String(a.first_sale_date||'')));
  if(!cases.length)throw new Error('Список кейсов пока недоступен');
  count.textContent=cases.length+' кейсов';
  grid.innerHTML=cases.map((item,index)=>`
   <article class="case-catalog-card">
    <div class="case-catalog-art">
     <img src="${escapeHTML(item.image||'')}" alt="${escapeHTML(item.name)}" loading="${index<6?'eager':'lazy'}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
     <span class="case-image-fallback" aria-hidden="true">📦</span>
    </div>
    <div class="case-catalog-info">
     <h3>${escapeHTML(item.name)}</h3>
     <span>${item.first_sale_date?new Date(item.first_sale_date+'T00:00:00').toLocaleDateString('ru-RU'):'CS2'}</span>
    </div>
   </article>`).join('');
 }catch(error){
  count.textContent='Каталог недоступен';
  grid.innerHTML='<p class="case-catalog-loading">Не получилось загрузить картинки кейсов. Проверь подключение к интернету и обнови страницу.</p>';
  console.error('CS2 case catalog:',error);
 }
}
