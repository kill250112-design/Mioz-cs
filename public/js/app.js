let balance=1000;
try {
  const saved=JSON.parse(localStorage.getItem('cs2cases-save')||'null');
  if(saved&&Number.isFinite(saved.balance)) balance=Math.max(0,saved.balance);
} catch(e) {}
const $=id=>document.getElementById(id);
const money=n=>Math.round(n).toLocaleString('ru-RU')+' ₽';
function saveBalance(){try{const old=JSON.parse(localStorage.getItem('cs2cases-save')||'{}');localStorage.setItem('cs2cases-save',JSON.stringify({...old,balance}));}catch(e){}}
function renderBalance(){ $('balance').textContent=money(balance); saveBalance(); }
renderBalance();

function showPage(page){
  const inventory=page==='inventory';
  $('case-catalog').classList.toggle('hidden',inventory);
  $('inventory-page').classList.toggle('hidden',!inventory);
  document.querySelectorAll('.bottom-nav [data-page]').forEach(button=>button.classList.toggle('active',button.dataset.page===page));
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.bottom-nav [data-page]').forEach(button=>button.addEventListener('click',()=>showPage(button.dataset.page)));

const CASES_API='https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json';
// Сюда будем добавлять названия кейсов, которые пользователь назначит кастомными.
const CUSTOM_CASE_NAMES=[];

function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function isCase(item){return item&&item.type==='Case'&&/case/i.test(item.name||'');}
function caseCard(item){
  return '<article class="case-catalog-card"><div class="case-catalog-art"><img src="'+escapeHTML(item.image||'')+'" alt="'+escapeHTML(item.name)+'" loading="lazy" decoding="async"><span class="case-image-fallback" aria-hidden="true">📦</span></div><div class="case-catalog-info"><h3>'+escapeHTML(item.name)+'</h3><span>'+(item.first_sale_date?new Date(item.first_sale_date+'T00:00:00').toLocaleDateString('ru-RU'):'CS2')+'</span></div></article>';
}
function paintCatalog(data){
  const allGrid=$('case-catalog-grid'),customGrid=$('custom-case-grid');
  const catalog=data.filter(isCase).sort((a,b)=>String(b.first_sale_date||'').localeCompare(String(a.first_sale_date||'')));
  const customSet=new Set(CUSTOM_CASE_NAMES.map(name=>name.toLowerCase()));
  const custom=catalog.filter(item=>customSet.has(String(item.name||'').toLowerCase()));
  const ordinary=catalog.filter(item=>!customSet.has(String(item.name||'').toLowerCase()));
  allGrid.innerHTML=catalog.length?catalog.map(caseCard).join(''):'<p class="case-catalog-loading">Кейсы не найдены.</p>';
  customGrid.innerHTML=custom.length?custom.map(caseCard).join(''):'';
  $('case-count').textContent=catalog.length+' кейсов';
  document.querySelectorAll('.case-catalog-art img').forEach(img=>img.addEventListener('error',()=>{img.style.display='none';img.nextElementSibling.style.display='grid';},{once:true}));
}
async function loadCatalog(){
  const grid=$('case-catalog-grid'),count=$('case-count');
  try{
    let data=null;
    try{const saved=sessionStorage.getItem('cs2-case-catalog');if(saved)data=JSON.parse(saved);}catch(e){}
    if(data)paintCatalog(data);
    const response=await fetch(CASES_API,{cache:'no-cache'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    data=await response.json();
    sessionStorage.setItem('cs2-case-catalog',JSON.stringify(data));
    paintCatalog(data);
  }catch(error){
    if(!grid.children.length||grid.querySelector('.case-catalog-loading')){
      count.textContent='Каталог недоступен';
      grid.innerHTML='<p class="case-catalog-loading">Не получилось загрузить актуальные кейсы. Проверь интернет и обнови страницу.</p>';
    }
    console.error('CS2 catalogue:',error);
  }
}
loadCatalog();

document.querySelectorAll('[data-case-category]').forEach(button=>button.addEventListener('click',()=>{
  const custom=button.dataset.caseCategory==='custom';
  $('all-cases-section').classList.toggle('hidden',custom);
  $('custom-cases-section').classList.toggle('hidden',!custom);
  document.querySelectorAll('[data-case-category]').forEach(tab=>tab.classList.toggle('active',tab===button));
}));

const TOPUP_AMOUNTS=[100,500,1000,10000,100000];
function openTopup(){
  if($('topup-modal'))return;
  const modal=document.createElement('div');modal.className='modal topup-modal';modal.id='topup-modal';
  modal.innerHTML='<section class="topup-dialog" role="dialog" aria-modal="true" aria-labelledby="topup-title"><button class="close topup-close" type="button" aria-label="Закрыть">×</button><span class="topup-kicker">CS2 WALLET</span><h2 id="topup-title">Пополнение баланса</h2><p>Выбери сумму виртуальных монет</p><div class="topup-options">'+TOPUP_AMOUNTS.map(amount=>'<button type="button" class="topup-option" data-topup="'+amount+'"><span>💰</span><b>+'+money(amount)+'</b></button>').join('')+'</div><small class="topup-note">Демо-пополнение — реальные деньги не списываются.</small></section>';
  document.body.appendChild(modal);
  const close=()=>modal.remove();
  modal.querySelector('.topup-close').addEventListener('click',close);
  modal.addEventListener('click',event=>{if(event.target===modal)close();});
  modal.querySelectorAll('[data-topup]').forEach(button=>button.addEventListener('click',()=>{
    const amount=Number(button.dataset.topup);if(!TOPUP_AMOUNTS.includes(amount))return;
    balance+=amount;renderBalance();close();
    const toast=document.createElement('div');toast.className='topup-toast';toast.textContent='Баланс пополнен на '+money(amount);document.body.appendChild(toast);
    window.setTimeout(()=>toast.remove(),2200);
  }));
}
$('topup-open').addEventListener('click',openTopup);
