(() => {
  'use strict';
  const projects = window.PORTFOLIO_PROJECTS;
  const grid = document.getElementById('project-grid');
  const search = document.getElementById('project-search');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const more = document.getElementById('show-more');
  const dialog = document.getElementById('project-dialog');
  const menu = document.getElementById('mobile-nav');
  const menuButton = document.querySelector('.menu-toggle');
  let selected = 'all';
  let expanded = false;
  let current = 0;
  let lastFocus = null;
  let saved = new Set();
  try {const stored=JSON.parse(localStorage.getItem('dhanush-saved-projects')||'[]');if(Array.isArray(stored))saved=new Set(stored.filter(id=>projects.some(p=>p.id===id)));} catch(e) {}
  let toastTimeout;
  function notify(message) {const toast=document.getElementById('toast');toast.textContent=message;toast.classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>toast.classList.remove('visible'),2600);}

  const escape = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function render() {
    const term = search.value.trim().toLowerCase();
    const filtered = projects.filter(p => (selected === 'all' || (selected === 'saved' && saved.has(p.id)) || p.category === selected) && `${p.title} ${p.subtitle} ${p.description} ${p.type} ${p.year}`.toLowerCase().includes(term));
    const displayed = expanded || term || selected !== 'all' ? filtered : filtered.slice(0, 6);
    grid.innerHTML = displayed.map((p, i) => `<article class="project-card" style="animation-delay:${Math.min(i,5)*35}ms"><button class="project-open" data-project="${p.id}" aria-label="Preview ${escape(p.title)}"><div class="project-image"><img src="${p.image}" alt="${escape(p.alt)}" loading="lazy" width="808" height="632"><span class="project-type">${escape(p.type)}</span><span class="project-arrow" aria-hidden="true"><svg class="arrow-up-right" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div><div class="project-info"><div><h3>${escape(p.title)}</h3><p>${escape(p.subtitle)}</p><p class="project-summary">${escape(p.description)}</p></div><span class="project-year">${p.year}</span></div></button><button class="bookmark-button" data-save="${p.id}" aria-pressed="${saved.has(p.id)}" aria-label="${saved.has(p.id)?'Remove':'Save'} ${escape(p.title)} ${saved.has(p.id)?'from':'to'} saved projects"><svg viewBox="0 0 18 22" fill="none" aria-hidden="true"><path d="M3 2h12v18l-6-4-6 4V2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button></article>`).join('');
    document.getElementById('empty-state').hidden = filtered.length !== 0;
    document.getElementById('saved-count').textContent = saved.size;
    document.querySelector('#empty-state h3').textContent = selected === 'saved' && !term ? 'Your collection starts here' : 'No projects found';
    document.querySelector('#empty-state p').textContent = selected === 'saved' && !term ? 'Bookmark any project to keep it here for a closer look.' : 'Try “healthcare”, “website”, or a different category.';
    document.getElementById('result-count').textContent = `Showing ${displayed.length} of ${filtered.length} projects`;
    const remaining = filtered.length - displayed.length;
    more.hidden = remaining <= 0;
    more.innerHTML = `Show ${remaining} more projects <span aria-hidden="true">+</span>`;
    document.getElementById('gallery-caption').hidden = filtered.length === 0;
    document.getElementById('gallery-caption').textContent = displayed.length === projects.length ? 'All 12 projects from my design archive' : 'A selection from my design archive';
  }

  function updateProject(id) {
    current = projects.findIndex(p => p.id === Number(id));
    if (current < 0) return;
    const p = projects[current];
    document.getElementById('dialog-meta').textContent = `${p.type}  ·  ${p.year}`;
    document.getElementById('dialog-title').textContent = p.title;
    document.getElementById('dialog-description').textContent = p.description;
    const img = document.getElementById('dialog-image');
    img.src = p.image;
    img.alt = p.alt;
    document.getElementById('dialog-link').href = p.url;
    dialog.scrollTop = 0;
  }

  function openProject(id) {
    lastFocus = document.activeElement;
    updateProject(id);
    if (current < 0) return;
    dialog.showModal();
    document.body.classList.add('dialog-open');
    document.querySelector('.close-dialog').focus();
  }

  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-project]');
    if (trigger) openProject(trigger.dataset.project);
    const bookmark=e.target.closest('[data-save]');
    if(bookmark){const id=Number(bookmark.dataset.save);const adding=!saved.has(id);adding?saved.add(id):saved.delete(id);let persisted=true;try{localStorage.setItem('dhanush-saved-projects',JSON.stringify([...saved]));}catch(e){persisted=false;}render();notify(adding?(persisted?'Project saved to your collection':'Project saved for this visit'):'Project removed from your collection');(grid.querySelector('[data-save="'+id+'"]')||document.querySelector('[data-filter="saved"]')).focus({preventScroll:true});}
  });
  document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {
    if (e.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    lastFocus?.focus({preventScroll:true});
  });
  document.getElementById('previous-project').addEventListener('click', () => updateProject(projects[(current-1+projects.length)%projects.length].id));
  document.getElementById('next-project').addEventListener('click', () => updateProject(projects[(current+1)%projects.length].id));
  dialog.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') {e.preventDefault(); updateProject(projects[(current+1)%projects.length].id);}
    if (e.key === 'ArrowLeft') {e.preventDefault(); updateProject(projects[(current-1+projects.length)%projects.length].id);}
  });

  filters.forEach(button => button.addEventListener('click', () => {
    selected = button.dataset.filter;
    expanded = false;
    filters.forEach(b => {b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button));});
    render();
  }));
  search.addEventListener('input', render);
  more.addEventListener('click', () => {
    expanded = true;
    render();
    grid.querySelectorAll('.project-open')[6]?.focus({preventScroll:true});
  });
  document.getElementById('clear-search').addEventListener('click', () => {
    search.value = '';
    filters[0].click();
    search.focus();
  });
  document.addEventListener('keydown', e => {
    if(e.key === '/' && !document.getElementById('quick-nav').open && !dialog.open && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) {
      e.preventDefault(); search.focus();
    }
  });

  const reelProjects = [projects[1], projects[0], projects[2], projects[3], projects[4], projects[5]];
  const reel = document.getElementById('reel');
  const reelMarkup = (p, duplicate) => `<button class="reel-card" data-project="${p.id}" aria-label="Preview ${escape(p.title)}" ${duplicate?'tabindex="-1" aria-hidden="true"':''}><img src="${p.image}" alt="" width="808" height="632"><span class="reel-label">${escape(p.title)} <span aria-hidden="true"><svg class="arrow-up-right" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span></button>`;
  reel.innerHTML = reelProjects.map(p => reelMarkup(p,false)).join('') + reelProjects.map(p => reelMarkup(p,true)).join('');
  const pause = document.querySelector('.reel-toggle');
  pause.addEventListener('click', () => {
    const paused = document.querySelector('.showcase').classList.toggle('paused');
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Play project animation' : 'Pause project animation');
    pause.querySelector('span').textContent = paused ? '▷' : 'Ⅱ';
  });

  const closeMenu = () => {menu.hidden = true; menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Open navigation');};
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded',String(open));
    menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e => {if(e.key === 'Escape' && !menu.hidden){closeMenu();menuButton.focus();}});
  document.addEventListener('click',e => {if(!e.target.closest('.header') && !menu.hidden)closeMenu();});
  const navLinks = [...document.querySelectorAll('.desktop-nav a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) navLinks.forEach(a => a.classList.toggle('current', a.hash === `#${entry.target.id}`));
    }), {rootMargin:'-20% 0px -50% 0px'});
    ['work','about','experience','approach'].forEach(id => observer.observe(document.getElementById(id)));
  }

  // Structured profile facts: omitted personal details never become dummy links.
  const profile=window.PORTFOLIO_PROFILE;
  document.querySelectorAll('[data-resume-link]').forEach(link=>{link.href=profile.resume.file;link.download=profile.resume.file.split('/').pop();link.querySelector('[data-resume-label]').textContent=profile.resume.label;});
  document.querySelectorAll('[data-resume-note]').forEach(el=>el.textContent=profile.resume.note);
  document.getElementById('education-list').innerHTML=profile.education.map(item=>`<article class="education-item"><span class="education-label">${escape(item.label)}</span><div><h3>${escape(item.qualification)}</h3>${item.school?`<p>${escape(item.school)}</p>`:''}${item.score?`<span class="education-score">${escape(item.score)}</span>`:''}</div>${item.period?`<time>${escape(item.period)}</time>`:''}</article>`).join('');
  if(profile.contact.address){const a=document.getElementById('about-address');a.textContent=profile.contact.address;a.hidden=false;}
  document.getElementById('experience-list').innerHTML=profile.experience.map((job,i)=>`<details class="experience-role" ${i===0?'open':''}><summary><h3>${escape(job.company)}</h3><p class="job-role">${escape(job.role)}</p><div class="job-meta">${job.period?`<span>${escape(job.period)}</span>`:''}${job.location?`<span>${escape(job.location)}</span>`:''}</div><span class="expand-indicator" aria-hidden="true">+</span></summary><div class="role-content"><p>${escape(job.summary)}</p>${job.responsibilities.length?`<h4>${escape(job.responsibilityHeading)}</h4><ul>${job.responsibilities.map(t=>`<li>${escape(t)}</li>`).join('')}</ul>`:''}<div class="role-tags">${job.disciplines.map(t=>`<span>${escape(t)}</span>`).join('')}</div><a class="text-link" href="${escape(job.url)}" target="_blank" rel="noopener noreferrer">View profile <span aria-hidden="true"><svg class="arrow-up-right" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></a></div></details>`).join('');
  const direct=document.getElementById('direct-contact');
  [['Email',profile.contact.email,'mailto:'],['Phone',profile.contact.phone,'tel:']].forEach(([label,value,protocol])=>{
    if(!value)return;
    const wrapper=document.createElement('div');wrapper.className='contact-method';
    const text=document.createElement('div');const title=document.createElement('span');title.className='contact-method-label';title.textContent=label.toUpperCase();
    const link=document.createElement('a');link.textContent=value;link.href=protocol+(protocol==='tel:'?value.replace(/[^+0-9]/g,''):value);text.append(title,link);
    const copy=document.createElement('button');copy.className='copy-contact';copy.textContent='Copy';copy.setAttribute('aria-label','Copy '+label.toLowerCase());copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(value);notify(label+' copied');}catch(e){notify('Copy unavailable. Select the '+label.toLowerCase()+' text to copy it.');}});
    wrapper.append(text,copy);direct.append(wrapper);direct.hidden=false;
  });
  const tabs=[...document.querySelectorAll('.about-tabs [role="tab"]')];
  function selectTab(tab,focus=false){tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!active;});if(focus)tab.focus();}
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',e=>{let index=i;if(e.key==='ArrowRight')index=(i+1)%tabs.length;else if(e.key==='ArrowLeft')index=(i-1+tabs.length)%tabs.length;else if(e.key==='Home')index=0;else if(e.key==='End')index=tabs.length-1;else return;e.preventDefault();selectTab(tabs[index],true);});});
  document.querySelectorAll('[data-skill-filter]').forEach(button=>button.addEventListener('click',()=>{search.value='';document.querySelector('[data-filter="'+button.dataset.skillFilter+'"]').click();document.getElementById('work').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});document.querySelector('[data-filter="'+button.dataset.skillFilter+'"]').focus({preventScroll:true});}));

  const themeButton=document.getElementById('theme-toggle');
  const syncThemeButton=()=>{const dark=document.documentElement.dataset.theme==='dark';themeButton.setAttribute('aria-pressed',String(dark));themeButton.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');themeButton.title=dark?'Switch to light mode':'Switch to dark mode';};
  themeButton.addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('dhanush-theme',theme);}catch(e){}syncThemeButton();});syncThemeButton();

  const quick=document.getElementById('quick-nav');const quickSearch=document.getElementById('quick-search');let quickFocus;
  const quickLinks=[...quick.querySelectorAll('nav a')];
  function filterQuick(){const term=quickSearch.value.trim().toLowerCase();quickLinks.forEach(a=>a.hidden=!a.textContent.toLowerCase().includes(term));document.getElementById('quick-empty').hidden=quickLinks.some(a=>!a.hidden);}
  function openQuick(){if(dialog.open)return;closeMenu();quickFocus=document.activeElement;quickSearch.value='';filterQuick();quick.showModal();document.body.classList.add('dialog-open');quickSearch.focus();}
  document.querySelectorAll('.quick-nav-trigger').forEach(button=>button.addEventListener('click',openQuick));
  document.getElementById('close-quick-nav').addEventListener('click',()=>quick.close());
  quick.addEventListener('close',()=>{document.body.classList.remove('dialog-open');quickFocus?.focus({preventScroll:true});});
  quick.addEventListener('click',e=>{if(e.target!==quick)return;const b=quick.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)quick.close();});
  quickLinks.forEach(a=>a.addEventListener('click',()=>quick.close()));quickSearch.addEventListener('input',filterQuick);
  quickSearch.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();quickLinks.find(a=>!a.hidden)?.click();}});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();quick.open?quick.close():openQuick();}});

  let ticking=false;function updateProgress(){const height=document.documentElement.scrollHeight-innerHeight;document.getElementById('reading-progress').style.width=(height>0?Math.min(100,scrollY/height*100):0)+'%';ticking=false;}
  addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(updateProgress);ticking=true;}},{passive:true});addEventListener('resize',updateProgress);updateProgress();
  if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');reveal.unobserve(entry.target);}}),{threshold:.08});document.querySelectorAll('.experience-intro,.skills,.approach-grid article,.contact').forEach(el=>{el.classList.add('will-reveal');reveal.observe(el);});}

  document.getElementById('year').textContent = new Date().getFullYear();
  render();
})();
