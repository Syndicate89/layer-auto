const hero = document.querySelector('.hero');
const stage = document.querySelector('#hero-stage');
const pauseButton = document.querySelector('#motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches || !!navigator.connection?.saveData;
const video=document.querySelector('#hero-video');
const names={paint:'도장면을 따라 흐르는 빛',glass:'유리 끝선까지 이어지는 정교함',coating:'표면의 질감에 더하는 완성도'};
function viewChanged(name,label){
  document.querySelectorAll('[data-scene]').forEach(button=>{const active=button.dataset.scene===name;button.setAttribute('aria-pressed',String(active));button.classList.toggle('active',active);});
  document.querySelector('#scene-caption').textContent=label;
  hero.dataset.view=name;
}
function tryPlay(){video.play().catch(error=>{if(error.name!=='AbortError'&&inView&&!document.hidden&&!paused)setPaused(true);});}
function setPaused(value){paused=value;hero.classList.toggle('motion-paused',paused);pauseButton.setAttribute('aria-pressed',String(paused));pauseButton.setAttribute('aria-label',paused?'히어로 애니메이션 재생':'히어로 애니메이션 일시정지');pauseButton.querySelector('span').textContent=paused?'재생':'일시정지';if(paused)video.pause();else if(inView&&!document.hidden)tryPlay();}
let inView=true;
const viewTimes={paint:0,glass:8.1,coating:15.3};
let pendingSeek=null;
const mobile=matchMedia('(max-width:760px)').matches;
video.preload=paused||navigator.connection?.saveData?'none':'auto';
video.src=mobile?'./assets/hero-film-mobile.mp4':'./assets/hero-film.mp4';
video.muted=true;
video.addEventListener('loadeddata',()=>{hero.classList.add('film-ready');if(pendingSeek!==null){video.currentTime=pendingSeek;pendingSeek=null;}});
video.addEventListener('error',()=>{hero.classList.add('film-fallback');hero.classList.remove('film-ready');video.pause();});
video.addEventListener('timeupdate',()=>{const t=video.currentTime;const view=t>=15.2&&t<21.7?'coating':t>=7.8&&t<15.2?'glass':'paint';viewChanged(view,names[view]);});
setPaused(paused);
pauseButton.addEventListener('click',()=>setPaused(!paused));
document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>{const name=button.dataset.scene;viewChanged(name,names[name]);if(video.readyState>=1)video.currentTime=viewTimes[name];else{pendingSeek=viewTimes[name];video.load();}}));
reducedMotion.addEventListener('change',event=>setPaused(event.matches));
new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(!inView)video.pause();else if(!paused&&!document.hidden)tryPlay();},{threshold:.1}).observe(hero);
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(!paused&&inView)tryPlay();});
// Subtle perspective follows the pointer, while the photography remains the focus.
hero.addEventListener('pointermove',event=>{if(paused||event.pointerType==='touch')return;const r=hero.getBoundingClientRect();stage.style.setProperty('--tilt-x',`${((event.clientY-r.top)/r.height-.5)*-1.5}deg`);stage.style.setProperty('--tilt-y',`${((event.clientX-r.left)/r.width-.5)*1.5}deg`);});
hero.addEventListener('pointerleave',()=>{stage.style.setProperty('--tilt-x','0deg');stage.style.setProperty('--tilt-y','0deg');});
const photoDialog=document.querySelector('#photo-dialog');
let photoIndex=0;
const photoButtons=[...document.querySelectorAll('[data-photo]')];
function displayPhoto(index){
  photoIndex=(index+photoButtons.length)%photoButtons.length;
  const button=photoButtons[photoIndex],image=button.querySelector('img');
  document.querySelector('#large-photo').src=image.getAttribute('src');
  document.querySelector('#large-photo').alt=image.alt;
  document.querySelector('#photo-title').textContent=button.dataset.photo;
  document.querySelector('#photo-count').textContent=`${String(photoIndex+1).padStart(2,'0')} / ${String(photoButtons.length).padStart(2,'0')}`;
}
photoButtons.forEach((button,index)=>button.addEventListener('click',()=>{displayPhoto(index);photoDialog.showModal();}));
document.querySelector('#photo-close').addEventListener('click',()=>photoDialog.close());
document.querySelector('#photo-prev').addEventListener('click',()=>displayPhoto(photoIndex-1));
document.querySelector('#photo-next').addEventListener('click',()=>displayPhoto(photoIndex+1));
photoDialog.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();displayPhoto(photoIndex+1);}if(event.key==='ArrowLeft'){event.preventDefault();displayPhoto(photoIndex-1);}});
