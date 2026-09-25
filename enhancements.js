// Progressive enhancements: content and contact links remain usable without JavaScript.
(()=>{
if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('js-motion');
const menu=document.getElementById('menu'),nav=document.getElementById('navlinks');
document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}});
const date=document.getElementById('date');date.min=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const dialog=document.getElementById('photo-viewer');
document.querySelectorAll('.gallery figure').forEach(figure=>{const img=figure.querySelector('img'),button=document.createElement('button');button.type='button';button.className='photo-button';button.setAttribute('aria-label','Enlarge: '+img.alt);img.before(button);button.append(img);button.onclick=()=>{dialog.querySelector('img').src=img.src;dialog.querySelector('img').alt=img.alt;dialog.querySelector('p').textContent=figure.querySelector('figcaption').textContent;dialog.showModal()}});
dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
document.getElementById('share-site').onclick=async()=>{const url='https://tinyurl.com/283r54ws',status=document.getElementById('share-status');try{if(navigator.share)await navigator.share({title:'Vishnu Ayurved Clinic, Udgir',url});else{await navigator.clipboard.writeText(url);status.textContent='Website link copied. Share it with family and friends.'}}catch(e){if(e.name!=='AbortError')status.textContent='Share this link: '+url}};
try{setLang(localStorage.getItem('clinic-language')==='mr'?'mr':'en')}catch(e){setLang('en')}
})();
