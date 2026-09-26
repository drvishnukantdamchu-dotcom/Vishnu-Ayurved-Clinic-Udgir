(()=>{
const menu=document.getElementById('menu'),nav=document.getElementById('navlinks');
menu.onclick=()=>{const expanded=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(expanded))};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}});
const search=document.getElementById('topic-search'),cards=[...document.querySelectorAll('.knowledge-card')];let category='all',language='mr';
function filter(){const term=search.value.trim().toLocaleLowerCase();let n=0;cards.forEach(card=>{const text=[...card.querySelectorAll('[data-mr]')].map(x=>x.dataset.mr+' '+x.dataset.en).join(' ').toLocaleLowerCase();const show=(category==='all'||card.dataset.category===category)&&text.includes(term);card.hidden=!show;if(show)n++});document.getElementById('topic-count').textContent=language==='mr'?new Intl.NumberFormat('mr-IN').format(n)+' विषय':n+' topics';document.getElementById('empty-topics').hidden=n!==0;}
function lang(value){language=value;document.documentElement.lang=value;document.querySelectorAll('[data-mr][data-en]').forEach(el=>el.textContent=el.dataset[value]);['en','mr'].forEach(l=>{const btn=document.getElementById(l+'Btn');btn.classList.toggle('active',l===value);btn.setAttribute('aria-pressed',String(l===value))});search.placeholder=value==='mr'?'उदा. प्रकृती, झोप, Panchakarma':'Try constitution, sleep, Panchakarma';filter()}
document.getElementById('enBtn').onclick=()=>lang('en');document.getElementById('mrBtn').onclick=()=>lang('mr');search.addEventListener('input',filter);
document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{category=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));filter()});lang('mr');
})();
