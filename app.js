(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Theme, navigation and scroll telemetry.
  const themeToggle = $('#themeToggle');
  try { if (localStorage.getItem('arjun-theme') === 'light') document.body.classList.add('light-theme'); } catch (_) {}
  const updateThemeGlyph = () => { themeToggle.querySelector('span').textContent = document.body.classList.contains('light-theme') ? '☀' : '◐'; };
  updateThemeGlyph();
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    try { localStorage.setItem('arjun-theme', document.body.classList.contains('light-theme') ? 'light' : 'dark'); } catch (_) {}
    updateThemeGlyph();
  });

  const menuToggle = $('#menuToggle');
  const mainNav = $('.main-nav');
  menuToggle.addEventListener('click', () => {
    const opened = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(opened));
    menuToggle.setAttribute('aria-label', opened ? 'Close navigation' : 'Open navigation');
  });
  $$('.main-nav a').forEach(link => link.addEventListener('click', () => {
    mainNav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false');
  }));

  const recruiterToggle = $('#recruiterToggle');
  recruiterToggle.addEventListener('click', () => {
    const active = document.body.classList.toggle('recruiter-mode');
    recruiterToggle.innerHTML = `<span class="pulse-dot"></span> ${active ? 'FULL EXPERIENCE' : 'RECRUITER VIEW'}`;
    recruiterToggle.setAttribute('aria-pressed', String(active));
    if (active) document.querySelector('#work').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  const progress = $('#scrollProgress');
  const backToTop = $('#backToTop');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    backToTop.classList.toggle('show', window.scrollY > 650);
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));
  $('#yearNow').textContent = new Date().getFullYear();

  // Reveal-on-scroll, with a no-motion fallback.
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    $$('.intro-section, .lab-section, .work-section, .sorter-deep-dive, .journey-section, .capabilities-section, .proof-section, .github-section, .contact-section').forEach(el => { el.classList.add('reveal'); observer.observe(el); });
  }

  // Ambient particle field. It is decorative and intentionally has no data or network access.
  const particleCanvas = $('#particleField');
  if (particleCanvas && !reducedMotion) {
    const ctx = particleCanvas.getContext('2d');
    let particles = []; let pointer = { x: -1000, y: -1000 };
    const resizeParticles = () => {
      const rect = particleCanvas.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      particleCanvas.width = Math.max(1, Math.floor(rect.width * dpr)); particleCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(85, Math.max(34, Math.floor(rect.width / 13)));
      particles = Array.from({ length: count }, () => ({ x: Math.random() * rect.width, y: Math.random() * rect.height, vx: (Math.random() - .5) * .17, vy: (Math.random() - .5) * .17, r: Math.random() * 1.4 + .35 }));
    };
    const drawParticles = () => {
      const rect = particleCanvas.getBoundingClientRect(); ctx.clearRect(0, 0, rect.width, rect.height);
      const light = document.body.classList.contains('light-theme');
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]; p.x += p.vx; p.y += p.vy;
        if (p.x < -5 || p.x > rect.width + 5) p.vx *= -1;
        if (p.y < -5 || p.y > rect.height + 5) p.vy *= -1;
        const dx = pointer.x - p.x; const dy = pointer.y - p.y; const distance = Math.hypot(dx, dy);
        if (distance < 110) { p.x -= dx * .00045; p.y -= dy * .00045; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = light ? 'rgba(0,130,119,.46)' : 'rgba(112,242,223,.65)'; ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]; const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 105) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = light ? `rgba(0,120,112,${(1 - d / 105) * .13})` : `rgba(112,242,223,${(1 - d / 105) * .12})`; ctx.lineWidth = .7; ctx.stroke(); }
        }
      }
      requestAnimationFrame(drawParticles);
    };
    particleCanvas.addEventListener('pointermove', e => { const r = particleCanvas.getBoundingClientRect(); pointer = { x: e.clientX - r.left, y: e.clientY - r.top }; });
    particleCanvas.addEventListener('pointerleave', () => { pointer = { x: -1000, y: -1000 }; });
    resizeParticles(); window.addEventListener('resize', resizeParticles, { passive: true }); requestAnimationFrame(drawParticles);
  }

  // Two-link inverse-kinematics arm demo.
  const armCanvas = $('#armCanvas');
  if (armCanvas) {
    const c = armCanvas.getContext('2d');
    let target = { x: 0, y: 0 }; let dragging = false; let reach = 180; let elbowUp = true; let armW = 700; let armH = 285; let scan = 0;
    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    const sizeArm = () => {
      const box = armCanvas.getBoundingClientRect(); armW = Math.max(260, box.width); armH = Math.max(180, box.height);
      const ratio = dpr(); armCanvas.width = Math.round(armW * ratio); armCanvas.height = Math.round(armH * ratio); c.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (!target.x) target = { x: armW * .36, y: armH * .37 };
      drawArm();
    };
    const drawArm = () => {
      c.clearRect(0, 0, armW, armH);
      const base = { x: armW * .19, y: armH * .78 }; const scale = Math.min(armW / 700, armH / 280, 1.15);
      const l1 = reach * .53 * scale; const l2 = reach * .47 * scale;
      const dx = target.x - base.x; const dy = base.y - target.y;
      const rawD = Math.hypot(dx, dy) || .001; const maxD = l1 + l2 - 2; const minD = Math.abs(l1 - l2) + 2;
      const dist = Math.min(maxD, Math.max(minD, rawD)); const tx = base.x + dx / rawD * dist; const ty = base.y - dy / rawD * dist;
      const d = Math.hypot(tx - base.x, base.y - ty);
      const cosA = Math.max(-1, Math.min(1, (l1*l1 + d*d - l2*l2) / (2*l1*d)));
      const angleTarget = Math.atan2(base.y - ty, tx - base.x); const offset = Math.acos(cosA) * (elbowUp ? 1 : -1); const a1 = angleTarget - offset;
      const joint = { x: base.x + l1 * Math.cos(a1), y: base.y - l1 * Math.sin(a1) };
      const a2 = Math.atan2(base.y - ty - (base.y - joint.y), tx - joint.x);
      const end = { x: joint.x + l2 * Math.cos(a2), y: joint.y - l2 * Math.sin(a2) };
      const light = document.body.classList.contains('light-theme');
      // floor and measurement grid
      c.strokeStyle = light ? 'rgba(0,80,85,.13)' : 'rgba(132,198,200,.11)'; c.lineWidth = 1;
      for (let x = 0; x <= armW; x += 28) { c.beginPath(); c.moveTo(x,0); c.lineTo(x,armH); c.stroke(); }
      for (let y = 0; y <= armH; y += 28) { c.beginPath(); c.moveTo(0,y); c.lineTo(armW,y); c.stroke(); }
      c.strokeStyle = light ? 'rgba(0,93,98,.45)' : 'rgba(127,188,194,.34)'; c.setLineDash([4,5]); c.beginPath(); c.moveTo(0,base.y+12); c.lineTo(armW,base.y+12); c.stroke(); c.setLineDash([]);
      // reach boundary
      c.beginPath(); c.arc(base.x,base.y,l1+l2,Math.PI,Math.PI*2); c.strokeStyle = light ? 'rgba(0,143,133,.2)' : 'rgba(112,242,223,.16)'; c.setLineDash([3,7]); c.stroke(); c.setLineDash([]);
      // arm links
      const drawLink = (a,b,width) => { c.beginPath(); c.moveTo(a.x,a.y); c.lineTo(b.x,b.y); c.lineWidth = width; c.lineCap='round'; c.strokeStyle = light ? '#607e82' : '#536f7d'; c.stroke(); c.beginPath(); c.moveTo(a.x,a.y); c.lineTo(b.x,b.y); c.lineWidth = width*.24; c.strokeStyle = light ? '#008f85' : '#8ef8e8'; c.stroke(); };
      drawLink(base,joint,14*scale); drawLink(joint,end,12*scale);
      const drawJoint = (p,r) => { c.beginPath(); c.arc(p.x,p.y,r,0,Math.PI*2); c.fillStyle=light?'#17383d':'#09151d'; c.fill(); c.lineWidth=2; c.strokeStyle=light?'#008f85':'#a0fff4'; c.stroke(); c.beginPath();c.arc(p.x,p.y,r*.35,0,Math.PI*2);c.fillStyle=light?'#008f85':'#3de2d0';c.fill(); };
      drawJoint(base,15*scale); drawJoint(joint,11*scale);
      // base plinth
      c.fillStyle = light ? '#42666a' : '#284653'; c.fillRect(base.x-25*scale,base.y+11,50*scale,9*scale);
      c.fillStyle = light ? '#1e3d43' : '#c5e5e8'; c.font = '9px monospace'; c.fillText('BASE / J1',base.x-22,base.y+34);
      // end effector
      c.strokeStyle = light ? '#008f85' : '#9dfff3'; c.lineWidth=3; c.beginPath(); c.moveTo(end.x,end.y); c.lineTo(end.x+8,end.y-13); c.lineTo(end.x+19,end.y-13); c.stroke();
      // target line and target
      c.setLineDash([3,5]); c.strokeStyle=light?'rgba(0,143,133,.65)':'rgba(112,242,223,.6)';c.lineWidth=1;c.beginPath();c.moveTo(end.x,end.y);c.lineTo(target.x,target.y);c.stroke();c.setLineDash([]);
      c.beginPath();c.arc(target.x,target.y,8,0,Math.PI*2);c.fillStyle=light?'#008f85':'#70f2df';c.fill();c.beginPath();c.arc(target.x,target.y,16,0,Math.PI*2);c.strokeStyle=light?'rgba(0,143,133,.45)':'rgba(112,242,223,.44)';c.stroke();
      c.strokeStyle=light?'rgba(0,143,133,.4)':'rgba(112,242,223,.36)';c.beginPath();c.moveTo(target.x-25,target.y);c.lineTo(target.x+25,target.y);c.moveTo(target.x,target.y-25);c.lineTo(target.x,target.y+25);c.stroke();
      const reachable = Math.abs(rawD - dist) < 2;
      $('#armStatus').textContent = reachable ? 'TARGET LOCKED' : 'LIMIT / CLAMPED';
      $('#armCoords').textContent = `X: ${Math.round(dx)} · Y: ${Math.round(dy)} · θ₁: ${(a1*180/Math.PI).toFixed(0)}° · θ₂: ${(Math.atan2(end.y-joint.y,end.x-joint.x)*180/Math.PI).toFixed(0)}°`;
      scan += 1; if (scan % 4 === 0) { /* status is intentionally local */ }
    };
    const pointerToTarget = e => { const box=armCanvas.getBoundingClientRect(); const x=e.clientX-box.left; const y=e.clientY-box.top; target={x:Math.max(armW*.24,Math.min(armW*.94,x)),y:Math.max(armH*.12,Math.min(armH*.84,y))}; drawArm(); };
    armCanvas.addEventListener('pointerdown', e => { dragging = true; armCanvas.setPointerCapture(e.pointerId); pointerToTarget(e); });
    armCanvas.addEventListener('pointermove', e => { if (dragging) pointerToTarget(e); });
    armCanvas.addEventListener('pointerup', () => { dragging = false; }); armCanvas.addEventListener('pointercancel', () => { dragging = false; });
    $('#armReach').addEventListener('input', e => { reach=Number(e.target.value); $('#reachOutput').textContent=`${reach} px`; drawArm(); });
    $('#armElbow').addEventListener('input', e => { elbowUp=Number(e.target.value)===0; $('#elbowOutput').textContent=elbowUp?'ELBOW UP':'ELBOW DOWN'; drawArm(); });
    $('#armReset').addEventListener('click', () => { reach=180;elbowUp=true;$('#armReach').value='180';$('#armElbow').value='0';$('#reachOutput').textContent='180 px';$('#elbowOutput').textContent='ELBOW UP';target={x:armW*.36,y:armH*.37};drawArm(); });
    sizeArm(); window.addEventListener('resize', sizeArm, { passive:true });
  }

  // Simulated PLC seal-in: START latches, STOP breaks, RESET clears.
  let motorOn = false; let scanCount = 1;
  const paintPlc = () => {
    $('#plcLamp').classList.toggle('on', motorOn); $('#plcState').textContent = motorOn ? 'MOTOR RUNNING' : 'MOTOR STOPPED';
    $('#startContact').classList.toggle('active', motorOn); $('#holdContact').classList.toggle('active', motorOn); $('#motorCoil').classList.toggle('active', motorOn);
    $('#stopContact').classList.add('active'); $('#plcScan').textContent = String(scanCount).padStart(4,'0');
    $('#rungLogicNote').textContent = motorOn ? 'M0.0 is latched. The parallel holding contact keeps Q0.0 energised.' : 'The motor output is de-energised. Press START to latch the run bit.';
  };
  const plcTransition = value => { motorOn=value; scanCount++; paintPlc(); };
  $('#plcStart').addEventListener('click', () => plcTransition(true));
  $('#plcStop').addEventListener('click', () => plcTransition(false));
  $('#plcReset').addEventListener('click', () => plcTransition(false)); paintPlc();

  // Selected projects: descriptions focus on implementation scope rather than inflated outcomes.
  const projectDetails = {
    waste:{kicker:'PROJECT / 01 · VISION + EMBEDDED',title:'Automatic waste sorter',description:'A prototype joining a trained YOLO model with an ESP32-CAM capture path and a servo-driven sorting mechanism. The laptop performs model inference; the control side maps the predicted category to the collector and bin movement.',details:[['PERCEPTION','YOLO model trained for plastic, organic, e-waste and recyclable classes'],['HARDWARE','ESP32-CAM, two servo motors and a collector mechanism'],['PIPELINE','Image capture → inference → class decision → actuation'],['ENGINEERING FOCUS','Coordinating computer vision decisions with physical movement']],tags:['YOLO','PYTHON','ESP32-CAM','SERVO CONTROL','COMPUTER VISION']},
    areca:{kicker:'PROJECT / 02 · MECHANICAL DESIGN',title:'Areca palm climbing robot',description:'A mechanical design exploration for climbing and harvesting on an areca palm. The CAD work focuses on enclosure geometry, wheel interaction and a spring-based gripper concept, with motion studies used to reason about the mechanism.',details:[['DESIGN','Climbing robot concept and mechanical layout'],['CAD','Fusion 360 modelling and assembly'],['MECHANISM','Wheel geometry and spring-based gripper'],['VALIDATION','Digital design review and motion-oriented simulation']],tags:['FUSION 360','CAD','MECHANISM DESIGN','MOTION STUDY']},
    sorting:{kicker:'PROJECT / 03 · INDUSTRIAL VISION',title:'Vision-based sorting automation',description:'A sorting automation concept using Python and OpenCV to inspect items and sensor-triggered pneumatic actuation to move them. Testing attention centred on response timing and mechanical alignment.',details:[['PERCEPTION','Python / OpenCV image processing'],['ACTUATION','Pneumatic pusher concept'],['CONTROL','Sensor-triggered sequence'],['FOCUS','Signal timing and mechanical alignment']],tags:['PYTHON','OPENCV','PNEUMATICS','SENSORS']},
    mimic:{kicker:'PROJECT / 04 · ROBOTICS',title:'Mimic robotic arm',description:'A microcontroller-based arm that follows operator movement through sensor inputs and servo outputs. The build explores mapping sensed motion to coordinated joint movement.',details:[['INPUT','Sensor-based motion capture'],['CONTROL','Microcontroller signal processing'],['OUTPUT','Coordinated servo actuation'],['FOCUS','Stable mapping and repeatable movement']],tags:['ARDUINO','SERVO','SENSORS','ROBOTICS']},
    human:{kicker:'PROJECT / 05 · EDGE AI',title:'Human detection for disaster response',description:'A Jetson Nano computer-vision exploration aimed at recognising people in camera imagery. It examines how inference can be brought closer to the sensing hardware.',details:[['COMPUTE','NVIDIA Jetson Nano'],['PERCEPTION','Human detection in camera frames'],['SOFTWARE','Python-based vision workflow'],['FOCUS','Edge inference and practical scene detection']],tags:['JETSON NANO','PYTHON','VISION','EDGE AI']},
    plc:{kicker:'PROJECT / 06 · INDUSTRIAL CONTROL',title:'Siemens PLC control systems',description:'A collection of PLC programming and simulation exercises, including ladder logic, I/O configuration and HMI-oriented control sequences. Related practice has included CODESYS and Factory I/O workflows.',details:[['PLATFORM','Siemens S7 families and TIA Portal'],['LOGIC','Ladder logic, sequencing and interlocks'],['INTERFACE','HMI concepts and process visualisation'],['VALIDATION','Simulation, I/O mapping and troubleshooting']],tags:['TIA PORTAL','SIEMENS','LADDER LOGIC','HMI','CODESYS']},
    idcard:{kicker:'PROJECT / 07 · COMPUTER VISION',title:'Student ID card detection',description:'A concept for detecting whether a student is wearing an ID card and linking the resulting event to a student information workflow. The intended workflow includes flagging missing-card events for an administrator.',details:[['MODEL','YOLO-based ID-card detection'],['VISION','Image-based presence classification'],['WORKFLOW','Detection record linked to student data'],['INTEGRATION IDEA','Admin notification workflow']],tags:['YOLOV8','PYTHON','DATABASE','AUTOMATION']},
    dobot:{kicker:'PROJECT / 08 · ROBOT KINEMATICS',title:'Dobot Magician kinematic analysis',description:'A study of robot geometry, joint parameters and end-effector motion. The work connects forward and inverse kinematics reasoning to workspace and movement constraints.',details:[['PLATFORM','Dobot Magician'],['ANALYSIS','Forward and inverse kinematics'],['METHOD','Joint-space to Cartesian reasoning'],['FOCUS','Reachability and end-effector position']],tags:['DOBOT','KINEMATICS','MATLAB','ROBOTICS']},
    plant:{kicker:'PROJECT / 09 · EMBEDDED IoT',title:'Smart plant monitoring',description:'An ESP8266-based plant monitoring prototype connecting sensors to a Blynk IoT dashboard. It explores remote visibility of basic plant-condition readings.',details:[['CONTROLLER','ESP8266'],['CONNECTIVITY','Wi-Fi / Blynk IoT'],['SENSING','Plant-condition sensor inputs'],['FOCUS','Remote monitoring and connected devices']],tags:['ESP8266','BLYNK','IoT','SENSORS']}
  };
  const modal = $('#projectModal');
  const openProject = id => {
    const p=projectDetails[id]; if(!p) return;
    $('#modalKicker').textContent=p.kicker; $('#modalTitle').textContent=p.title; $('#modalDescription').textContent=p.description;
    $('#modalDetails').innerHTML=p.details.map(([k,v])=>`<div class="modal-detail"><b>${escapeHtml(k)}</b><span>${escapeHtml(v)}</span></div>`).join('');
    $('#modalTags').innerHTML=p.tags.map(t=>`<span>${escapeHtml(t)}</span>`).join('');
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; $('#modalGithub').focus();
  };
  const closeProject = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };
  $$('.project-open').forEach(button=>button.addEventListener('click',()=>openProject(button.dataset.project)));
  $$('[data-close-modal]').forEach(el=>el.addEventListener('click',closeProject));

  const projectCards = $$('.project-card'); let activeFilter='all';
  const projectSearch = $('#projectSearch');
  const updateProjects = () => {
    const query=projectSearch.value.trim().toLowerCase(); let visible=0;
    projectCards.forEach(card=>{
      const cats=card.dataset.category.split(' '); const text=(card.dataset.search+' '+card.innerText).toLowerCase();
      const matchesFilter=activeFilter==='all'||cats.includes(activeFilter); const matchesQuery=!query||text.includes(query);
      const show=matchesFilter&&matchesQuery; card.hidden=!show; if(show)visible++;
    });
    $('#projectCount').textContent=String(visible).padStart(2,'0')+' PROJECTS'; $('#emptyProjects').hidden=visible!==0;
  };
  $$('.filter-chip').forEach(button=>button.addEventListener('click',()=>{
    activeFilter=button.dataset.filter; $$('.filter-chip').forEach(b=>b.classList.toggle('active',b===button)); updateProjects();
  }));
  projectSearch.addEventListener('input',updateProjects);

  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }

  // Public GitHub REST read: unauthenticated, and only displays public profile repositories.
  const githubRepos = $('#githubRepos');
  fetch('https://api.github.com/users/arjunrose/repos?sort=updated&per_page=100', { headers: { 'Accept':'application/vnd.github+json' } })
    .then(response => { if (!response.ok) throw new Error(`GitHub API ${response.status}`); return response.json(); })
    .then(repos => {
      const chosen=repos.filter(r=>!r.fork).sort((a,b)=>new Date(b.pushed_at)-new Date(a.pushed_at)).slice(0,4);
      $('#githubSync').textContent='SYNC COMPLETE';
      if(!chosen.length){githubRepos.innerHTML='<p class="repo-item"><a href="https://github.com/arjunrose?tab=repositories">Browse repositories ↗</a></p>';return;}
      githubRepos.innerHTML=chosen.map(r=>`<article class="repo-item"><a href="${r.html_url}" target="_blank" rel="noreferrer">${escapeHtml(r.name)} ↗</a><small>${escapeHtml(r.language||'SOURCE')}</small><p>${escapeHtml(r.description||'Public repository / project files')}</p></article>`).join('');
    })
    .catch(() => { $('#githubSync').textContent='LIVE LINK AVAILABLE'; githubRepos.innerHTML='<div class="repo-item"><a href="https://github.com/arjunrose?tab=repositories" target="_blank" rel="noreferrer">Open all public repositories ↗</a><small>GITHUB</small><p>Repository preview is unavailable right now. The profile link remains available.</p></div>'; });

  // Contact route: use a configured serverless endpoint if present; otherwise prepare a mailto draft.
  $('#contactForm').addEventListener('submit', async event => {
    event.preventDefault(); const form=event.currentTarget; const values=Object.fromEntries(new FormData(form).entries());
    const status=$('#formStatus'); const button=$('.submit-button',form);
    if(values.website) return;
    const subject=`Portfolio enquiry — ${values.topic||'Message'}`;
    const body=`Name: ${values.name}\nEmail: ${values.email}\nTopic: ${values.topic}\n\n${values.message}`;
    button.disabled=true; button.textContent='PREPARING...';
    try {
      const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});
      if(response.ok){status.textContent='Message sent. Thank you for reaching out.';form.reset();button.innerHTML='MESSAGE SENT <span>✓</span>';return;}
    } catch (_) { /* Static GitHub Pages has no API route. */ }
    status.textContent='Your email app is opening with the message ready. Review it and press Send.';
    window.location.href=`mailto:arjunrose2005@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    button.disabled=false;button.innerHTML='PREPARE MESSAGE <span>↗</span>';
  });

  // Local portfolio guide. It routes visitors to existing content; it is not represented as a hosted LLM.
  const guideLaunch=$('#guideLaunch'); const guidePanel=$('#guidePanel');
  const guideOpen = open => { guidePanel.hidden=!open; guideLaunch.setAttribute('aria-expanded',String(open)); };
  guideLaunch.addEventListener('click',()=>guideOpen(guidePanel.hidden)); $('#guideClose').addEventListener('click',()=>guideOpen(false));
  const guideResponses = [
    {match:/plc|automation|ladder|siemens|factory|hmi/i, text:'Industrial automation is in the Capabilities section. The Siemens PLC project and interactive seal-in rung are also available in the Work and Interactive Lab sections.',target:'#lab'},
    {match:/robot|kinematic|dobot|arm|mechanical|areca/i, text:'Explore the inverse-kinematics arm in the Interactive Lab, then open the Areca palm climbing robot, Mimic arm and Dobot kinematics builds.',target:'#lab'},
    {match:/ai|vision|yolo|waste|detection|jetson|opencv/i, text:'The strongest AI examples are the Automatic Waste Sorter, Human Detection for Disaster Response and Student ID Card Detection. The waste-sorting architecture is explained as a complete pipeline.',target:'#work'},
    {match:/yaskawa|intern|experience|industry|tnpl|factory/i, text:'The Field Experience section covers the Yaskawa India internship, TNPL plant exposure and Siemens PLC training, including the robot platforms and plant systems.',target:'#journey'},
    {match:/skill|stack|program|language|tool/i, text:'The Capabilities section groups the toolset into industrial automation, robotics and mechanics, vision and applied AI, and embedded connectivity.',target:'#capabilities'},
    {match:/education|certificate|course|award|college/i, text:'Education and selected learning pathways are listed in the Education & Credentials section.',target:'#proof'},
    {match:/contact|email|hire|job|recruit|opportunit/i, text:'Use the contact form or email arjunrose2005@gmail.com. LinkedIn and GitHub links are listed beside the contact section.',target:'#contact'},
    {match:/github|repository|source|code/i, text:'The GitHub panel loads a live preview of public repositories when the GitHub API is reachable. You can also open the full profile directly.',target:'.github-section'}
  ];
  const answerGuide = query => {
    const result=guideResponses.find(item=>item.match.test(query));
    const response=result?result.text:'Try asking about PLC, robotics, AI projects, Yaskawa, education, skills, GitHub or contact. I can point you to the matching section.';
    $('#guideResponse').textContent=response;
    if(result) { const link=document.createElement('button'); link.className='text-button'; link.type='button'; link.textContent='GO TO SECTION ↗'; link.style.display='block'; link.style.marginTop='8px'; link.addEventListener('click',()=>{guideOpen(false);document.querySelector(result.target)?.scrollIntoView({behavior:reducedMotion?'auto':'smooth'});}); $('#guideResponse').appendChild(link); }
  };
  $('#guideForm').addEventListener('submit',e=>{e.preventDefault();const query=$('#guideInput').value.trim();if(query)answerGuide(query);});
  $$('[data-guide]').forEach(b=>b.addEventListener('click',()=>answerGuide(b.dataset.guide)));

  // Command palette: Ctrl/Cmd + K.
  const palette=$('#commandPalette');const paletteInput=$('#paletteInput');
  const openPalette=()=>{palette.classList.add('open');palette.setAttribute('aria-hidden','false');paletteInput.value='';paletteInput.focus();};
  const closePalette=()=>{palette.classList.remove('open');palette.setAttribute('aria-hidden','true');};
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette();}
    if(e.key==='Escape'){closePalette();closeProject();guideOpen(false);}
  });
  $$('[data-close-palette]').forEach(el=>el.addEventListener('click',closePalette));
  const action = key => {
    const map={work:()=>$('#work').scrollIntoView({behavior:'smooth'}),lab:()=>$('#lab').scrollIntoView({behavior:'smooth'}),journey:()=>$('#journey').scrollIntoView({behavior:'smooth'}),contact:()=>$('#contact').scrollIntoView({behavior:'smooth'}),github:()=>window.open('https://github.com/arjunrose','_blank','noopener')};
    if(map[key]){closePalette();map[key]();}
  };
  $$('.palette-results button').forEach(b=>b.addEventListener('click',()=>action(b.dataset.action)));
  paletteInput.addEventListener('input',()=>{
    const q=paletteInput.value.toLowerCase();
    $$('.palette-results button').forEach(b=>{b.hidden=!!q&&!b.textContent.toLowerCase().includes(q);});
  });
  paletteInput.addEventListener('keydown',e=>{
    if(e.key==='Enter'){const first=$('.palette-results button:not([hidden])');if(first)first.click();}
  });
})();
