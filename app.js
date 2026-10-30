const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('static-preview');

// Boot sequence: a short visual transition, never a blocking asset dependency.
(() => {
  const screen = $('#bootScreen'), bar = $('#bootProgress'), pct = $('#bootPercent');
  if (!screen) return;
  const started = performance.now();
  const tick = now => {
    const ratio = Math.min(1, (now - started) / 820);
    const eased = 1 - Math.pow(1 - ratio, 3);
    const value = Math.round(eased * 100);
    bar.style.width = `${value}%`; pct.textContent = `${String(value).padStart(2, '0')}%`;
    if (ratio < 1) requestAnimationFrame(tick);
    else setTimeout(() => screen.classList.add('done'), 140);
  };
  requestAnimationFrame(tick);
})();

// Ambient points: lightweight 2D field, independent from the 3D scene.
(() => {
  const canvas = $('#starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, points = [], dpr = 1, raf = 0;
  const pointer = { x: -1000, y: -1000 };
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(105, Math.floor(width * height / 14500));
    points = Array.from({ length: count }, () => ({ x: Math.random() * width, y: Math.random() * height, r: .45 + Math.random() * 1.1, a: .12 + Math.random() * .32, dx: (Math.random() - .5) * .12, dy: (Math.random() - .5) * .12 }));
  };
  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    for (const p of points) {
      p.x += p.dx; p.y += p.dy;
      if (p.x < -10) p.x = width + 10; if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10; if (p.y > height + 10) p.y = -10;
      const dx = pointer.x - p.x, dy = pointer.y - p.y, dist = Math.hypot(dx, dy);
      const boost = dist < 180 ? (1 - dist / 180) * .25 : 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(197,226,204,${Math.min(.7, p.a + boost)})`; ctx.fill();
    }
    if (!reducedMotion) raf = requestAnimationFrame(draw);
  };
  window.addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  resize(); draw();
})();

// Cursor aura only appears on devices with a precise pointer.
if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reducedMotion) {
  const aura = $('#cursorAura');
  let x = -400, y = -400, tx = x, ty = y;
  window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; aura.style.opacity = '.9'; }, { passive: true });
  window.addEventListener('blur', () => { aura.style.opacity = '0'; });
  const move = () => { x += (tx - x) * .12; y += (ty - y) * .12; aura.style.left = `${x}px`; aura.style.top = `${y}px`; requestAnimationFrame(move); };
  move();
}


// Number counters animate once when the evidence strip enters view.
(() => {
  const counters = $$('[data-count]');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target);
    const element = entry.target, target = Number(element.dataset.count), plus = element.querySelector('span') ? '<span>+</span>' : '';
    const started = performance.now(), duration = reducedMotion ? 0 : 850;
    const tick = now => {
      const progress = duration ? Math.min(1, (now - started) / duration) : 1;
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      element.innerHTML = `${String(value).padStart(2, '0')}${plus}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .55 });
  counters.forEach(counter => observer.observe(counter));
})();

// Subtle pointer tilt gives the project archive a dimensional, tactile response.
if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reducedMotion) {
  $$('.project-card').forEach(card => {
    let frame = 0;
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - .5;
      const ny = (event.clientY - rect.top) / rect.height - .5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        card.style.setProperty('--tilt-x', `${(-ny * 2.5).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${(nx * 3.5).toFixed(2)}deg`);
      });
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg'); card.style.setProperty('--tilt-y', '0deg');
    });
  });
}

// Scroll state and reveal-in-view choreography.
(() => {
  const readingLine = $('#readingLine'), topReturn = $('#topReturn');
  let scrollTicking = false;
  const onScroll = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max > 0 ? (window.scrollY / max) * 100 : 0;
      readingLine.style.width = `${value}%`;
      topReturn.classList.toggle('show', window.scrollY > 650);
      scrollTicking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  topReturn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));
  const io = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); }
  }), { threshold: .13, rootMargin: '0px 0px -35px 0px' });
  $$('.reveal').forEach(el => io.observe(el));
  const sections = ['lab', 'projects', 'journey', 'capabilities'].map(id => document.getElementById(id)).filter(Boolean);
  const navLinks = $$('.topnav a');
  const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) navLinks.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
  }), { rootMargin: '-35% 0px -55% 0px' });
  sections.forEach(section => sectionObserver.observe(section));
})();

// Theme switch. It affects CSS variables only; no page reload required.
(() => {
  const root = document.documentElement, button = $('#themeToggle');
  const saved = localStorage.getItem('ar-theme');
  if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
  button.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next; localStorage.setItem('ar-theme', next);
    button.setAttribute('aria-label', next === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  });
})();

// Mobile navigation.
(() => {
  const button = $('#menuToggle'), menu = $('#mobileMenu');
  const close = () => { menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true'); button.setAttribute('aria-expanded', 'false'); };
  button.addEventListener('click', () => {
    const open = !menu.classList.contains('open');
    menu.classList.toggle('open', open); menu.setAttribute('aria-hidden', String(!open)); button.setAttribute('aria-expanded', String(open));
  });
  $$('a', menu).forEach(link => link.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

// Real-time 3D digital twin. If WebGL/CDN is unavailable, the rest of the portfolio still works.
let THREE = null;
const threeModuleReady = Promise.race([
  import('three'),
  new Promise((_, reject) => setTimeout(() => reject(new Error('3D module load timeout')), 5000))
]).then(module => { THREE = module; return module; }).catch(error => {
  console.warn('3D module unavailable; non-3D portfolio remains active.', error);
  return null;
});

let heroTwin = null, labTwin = null;
const twinInstances = [];
function createRobotTwin(canvas, onPose = () => {}) {
  if (!canvas) return null;
  const host = canvas.parentElement;
  const fallback = () => {
    canvas.hidden = true; host?.classList.add('no-webgl');
    const fallbackA1 = 20 * Math.PI / 180, fallbackA2 = 35 * Math.PI / 180;
    const fallbackEnd = { x: 1.55 * Math.cos(fallbackA1) + 1.42 * Math.cos(fallbackA1 + fallbackA2), y: .78 + 1.55 * Math.sin(fallbackA1) + 1.42 * Math.sin(fallbackA1 + fallbackA2) };
    onPose({ angle1: fallbackA1, angle2: fallbackA2, end: fallbackEnd, target: fallbackEnd, reachable: true });
    if (host && !host.querySelector('.fallback-twin')) host.insertAdjacentHTML('beforeend', '<div class=\"fallback-twin\" aria-label=\"Stylised robotic arm illustration\"><svg viewBox=\"0 0 420 280\" role=\"img\" aria-label=\"Robotic arm illustration\"><defs><linearGradient id=\"fmetal\" x1=\"0\" x2=\"1\"><stop stop-color=\"#607b70\"/><stop offset=\".5\" stop-color=\"#e4f1d8\"/><stop offset=\"1\" stop-color=\"#587368\"/></linearGradient></defs><ellipse cx=\"208\" cy=\"244\" rx=\"120\" ry=\"16\" fill=\"#d6ff4f\" opacity=\".12\"/><path d=\"M116 235h184l-12 18H128z\" fill=\"#263b3d\" stroke=\"#d6ff4f\"/><path d=\"M200 222 165 128l33-11 43 95z\" fill=\"url(#fmetal)\" stroke=\"#c9e1d3\" stroke-width=\"3\"/><path d=\"m185 122 105-77 24 28-99 88z\" fill=\"url(#fmetal)\" stroke=\"#c9e1d3\" stroke-width=\"3\"/><circle cx=\"182\" cy=\"126\" r=\"21\" fill=\"#172a2b\" stroke=\"#d6ff4f\" stroke-width=\"5\"/><circle cx=\"300\" cy=\"62\" r=\"16\" fill=\"#172a2b\" stroke=\"#d6ff4f\" stroke-width=\"4\"/><path d=\"m313 55 51-6 8 14-49 13z\" fill=\"#75e5d6\"/><path d=\"m367 65 15 5-11 28-15-5m21-18 14 23\" fill=\"none\" stroke=\"#75e5d6\" stroke-width=\"5\" stroke-linecap=\"round\"/><circle cx=\"210\" cy=\"218\" r=\"25\" fill=\"#172a2b\" stroke=\"#d6ff4f\" stroke-width=\"5\"/><circle cx=\"210\" cy=\"218\" r=\"9\" fill=\"#d6ff4f\"/></svg><span>3D VIEW UNAVAILABLE / STATIC MODEL</span></div>');
  };
  if (!THREE) { fallback(); return null; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch (error) { console.warn('WebGL unavailable; showing a static model.', error); fallback(); return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x091015, .045);
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 60);
  camera.position.set(.25, 2.8, 7.8); camera.lookAt(.15, 1.05, 0);
  scene.add(new THREE.HemisphereLight(0xd9f1df, 0x1a2b2b, 1.55));
  const key = new THREE.DirectionalLight(0xe8f5de, 2.4); key.position.set(-3, 5, 5); scene.add(key);
  const rim = new THREE.PointLight(0xd6ff4f, 28, 10); rim.position.set(2.5, 2.4, 2); scene.add(rim);
  const cyan = new THREE.PointLight(0x68e4d5, 14, 9); cyan.position.set(-2.5, 1.5, -1); scene.add(cyan);

  const mat = (color, metalness = .65, roughness = .3) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const graphite = mat(0x263b3d, .85, .25), steel = mat(0x9fb8ad, .8, .25), bright = mat(0xe4f2df, .65, .23), acid = mat(0xd6ff4f, .45, .24), dark = mat(0x101b20, .75, .28), cyanMat = mat(0x75e5d6, .5, .2);
  const robot = new THREE.Group(); scene.add(robot);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(.72, .82, .28, 48), dark); base.position.y = .13; robot.add(base);
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(.66, .025, 8, 64), acid); baseRing.rotation.x = Math.PI / 2; baseRing.position.y = .29; robot.add(baseRing);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(.42, .48, .56, 40), graphite); pedestal.position.y = .52; robot.add(pedestal);
  const shoulder = new THREE.Group(); shoulder.position.set(0, .78, 0); robot.add(shoulder);
  const shoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(.25, 32, 24), graphite); shoulder.add(shoulderJoint);
  const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(.16, 24, 16), acid); shoulderCap.position.z = .18; shoulder.add(shoulderCap);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(1.52, .18, .22), steel); upper.position.x = .78; shoulder.add(upper);
  const upperStripe = new THREE.Mesh(new THREE.BoxGeometry(.88, .025, .232), bright); upperStripe.position.set(.88, .075, .002); shoulder.add(upperStripe);
  const elbow = new THREE.Group(); elbow.position.x = 1.55; shoulder.add(elbow);
  const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(.19, 28, 20), graphite); elbow.add(elbowJoint);
  const elbowCap = new THREE.Mesh(new THREE.CylinderGeometry(.135, .135, .1, 32), acid); elbowCap.rotation.x = Math.PI / 2; elbowCap.position.z = .13; elbow.add(elbowCap);
  const forearm = new THREE.Mesh(new THREE.BoxGeometry(1.12, .14, .18), bright); forearm.position.x = .56; elbow.add(forearm);
  const forearmStripe = new THREE.Mesh(new THREE.BoxGeometry(.68, .018, .19), cyanMat); forearmStripe.position.set(.63, .06, .005); elbow.add(forearmStripe);
  const wrist = new THREE.Group(); wrist.position.x = 1.12; elbow.add(wrist);
  const wristJoint = new THREE.Mesh(new THREE.SphereGeometry(.115, 20, 16), acid); wrist.add(wristJoint);
  const toolBody = new THREE.Mesh(new THREE.BoxGeometry(.24, .2, .18), graphite); toolBody.position.x = .16; wrist.add(toolBody);
  const fingerOne = new THREE.Mesh(new THREE.BoxGeometry(.34, .045, .055), cyanMat); fingerOne.position.set(.36, .09, .02); wrist.add(fingerOne);
  const fingerTwo = new THREE.Mesh(new THREE.BoxGeometry(.34, .045, .055), cyanMat); fingerTwo.position.set(.36, -.09, .02); wrist.add(fingerTwo);

  const target = new THREE.Group(); scene.add(target);
  const targetRing = new THREE.Mesh(new THREE.TorusGeometry(.18, .012, 8, 44), acid); target.add(targetRing);
  const targetDot = new THREE.Mesh(new THREE.SphereGeometry(.045, 16, 12), acid); targetDot.position.z = .03; target.add(targetDot);
  const targetRay = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, 4, 6), acid); targetRay.rotation.z = Math.PI / 2; targetRay.material = new THREE.MeshBasicMaterial({ color: 0xd6ff4f, transparent: true, opacity: .25 }); targetRay.position.set(0, 0, -.08); target.add(targetRay);
  const targetHalo = new THREE.Mesh(new THREE.TorusGeometry(.27, .004, 6, 48), cyanMat); targetHalo.position.z = -.02; target.add(targetHalo);

  // XY reference grid placed behind the arm, plus a coordinate origin marker.
  const grid = new THREE.GridHelper(8, 40, 0x3c6660, 0x1c3636); grid.rotation.x = Math.PI / 2; grid.position.set(0, .02, -.28);
  (Array.isArray(grid.material) ? grid.material : [grid.material]).forEach(material => { material.transparent = true; material.opacity = .32; });
  scene.add(grid);
  const axisMat = new THREE.LineBasicMaterial({ color: 0x6e9890, transparent: true, opacity: .35 });
  const axes = new THREE.Group();
  const xAxis = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-4, .78, -.25), new THREE.Vector3(4, .78, -.25)]);
  const yAxis = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -.25), new THREE.Vector3(0, 4, -.25)]);
  axes.add(new THREE.Line(xAxis, axisMat), new THREE.Line(yAxis, axisMat)); scene.add(axes);

  let angle1 = 20 * Math.PI / 180, angle2 = 35 * Math.PI / 180;
  const lengths = { a: 1.55, b: 1.42 };
  let desired = { x: lengths.a * Math.cos(angle1) + lengths.b * Math.cos(angle1 + angle2), y: .78 + lengths.a * Math.sin(angle1) + lengths.b * Math.sin(angle1 + angle2) };
  let actual = { ...desired };
  let dragging = false, destroyed = false, frame = 0;
  let width = 0, height = 0, viewYaw = 0, targetYaw = 0;
  host.addEventListener('pointermove', event => {
    const rect = host.getBoundingClientRect();
    targetYaw = ((event.clientX - rect.left) / Math.max(1, rect.width) - .5) * .18;
  }, { passive: true });
  host.addEventListener('pointerleave', () => { targetYaw = 0; }, { passive: true });

  const forward = () => ({ x: lengths.a * Math.cos(angle1) + lengths.b * Math.cos(angle1 + angle2), y: .78 + lengths.a * Math.sin(angle1) + lengths.b * Math.sin(angle1 + angle2) });
  const inverse = (x, y) => {
    const yy = y - .78; const radius = Math.hypot(x, yy);
    const clamped = Math.max(.48, Math.min(lengths.a + lengths.b - .03, radius));
    const scale = radius > .001 ? clamped / radius : 1;
    x *= scale; yy *= scale;
    const c2 = Math.max(-1, Math.min(1, (x * x + yy * yy - lengths.a ** 2 - lengths.b ** 2) / (2 * lengths.a * lengths.b)));
    const a2 = Math.acos(c2);
    const a1 = Math.atan2(yy, x) - Math.atan2(lengths.b * Math.sin(a2), lengths.a + lengths.b * Math.cos(a2));
    return { a1, a2, x, y: yy + .78, reachable: Math.abs(clamped - radius) < .025 };
  };
  const applyTarget = (x, y, report = true) => {
    const solution = inverse(x, y);
    angle1 = solution.a1; angle2 = solution.a2; desired = { x: solution.x, y: solution.y };
    if (report) onPose({ angle1, angle2, end: forward(), target: desired, reachable: solution.reachable });
  };
  const applyAngles = (a1, a2, report = true) => {
    angle1 = a1 * Math.PI / 180; angle2 = a2 * Math.PI / 180;
    desired = forward();
    if (report) onPose({ angle1, angle2, end: forward(), target: desired, reachable: true });
  };
  const resize = () => {
    const rect = host.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host); resize();
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), intersection = new THREE.Vector3();
  const pointFromEvent = event => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    if (!raycaster.ray.intersectPlane(plane, intersection)) return null;
    return { x: Math.max(-2.4, Math.min(2.5, intersection.x)), y: Math.max(.8, Math.min(3.05, intersection.y)) };
  };
  canvas.style.cursor = 'crosshair';
  canvas.addEventListener('pointerdown', event => { dragging = true; canvas.setPointerCapture?.(event.pointerId); const p = pointFromEvent(event); if (p) applyTarget(p.x, p.y); });
  canvas.addEventListener('pointermove', event => { if (!dragging) return; const p = pointFromEvent(event); if (p) applyTarget(p.x, p.y); });
  const stopDrag = () => { dragging = false; };
  canvas.addEventListener('pointerup', stopDrag); canvas.addEventListener('pointercancel', stopDrag); canvas.addEventListener('lostpointercapture', stopDrag);

  const clock = new THREE.Clock();
  const render = () => {
    if (destroyed) return;
    const dt = Math.min(clock.getDelta(), .05);
    actual.x += (desired.x - actual.x) * Math.min(1, dt * 8);
    actual.y += (desired.y - actual.y) * Math.min(1, dt * 8);
    const pose = inverse(actual.x, actual.y);
    shoulder.rotation.z = pose.a1; elbow.rotation.z = pose.a2;
    target.position.set(desired.x, desired.y, .03);
    target.rotation.z += dt * (reducedMotion ? 0 : .18);
    viewYaw += (targetYaw - viewYaw) * Math.min(1, dt * 3);
    robot.rotation.y = viewYaw + (reducedMotion ? 0 : Math.sin(performance.now() * .00025) * .018);
    renderer.render(scene, camera);
    if (!reducedMotion) frame = requestAnimationFrame(render);
  };
  render();
  const dispose = () => { destroyed = true; cancelAnimationFrame(frame); resizeObserver.disconnect(); renderer.dispose(); };
  const setJointAngles = (a1, a2) => applyAngles(a1, a2);
  const setTarget = (x, y) => applyTarget(x, y);
  const runSequence = async () => {
    const path = [{ x: 1.7, y: 1.8 }, { x: 2.25, y: 1.05 }, { x: 2.0, y: 1.3 }, { x: 1.4, y: 2.2 }, { x: 1.7, y: 1.8 }];
    for (const p of path) { if (destroyed) return; setTarget(p.x, p.y); await new Promise(resolve => setTimeout(resolve, 700)); }
  };
  const initial = forward(); desired = { ...initial }; actual = { ...initial }; target.position.set(desired.x, desired.y, .03);
  onPose({ angle1, angle2, end: initial, target: desired, reachable: true });
  const instance = { setJointAngles, setTarget, runSequence, dispose, getPose: () => ({ angle1, angle2, end: forward() }) };
  twinInstances.push(instance);
  return instance;
}

const initialiseDigitalTwins = () => {
  heroTwin = createRobotTwin($('#heroRobot'), pose => {
    $('#heroHeroCoords').textContent = `X ${pose.end.x.toFixed(2)} / Y ${pose.end.y.toFixed(2)}`;
    $('#heroToolState').textContent = 'TRACKING';
  });

  labTwin = createRobotTwin($('#twinRobot'), pose => {
    $('#jointOne').value = String(Math.round(pose.angle1 * 180 / Math.PI));
    $('#jointTwo').value = String(Math.round(pose.angle2 * 180 / Math.PI));
    $('#jointOneValue').textContent = `${pose.angle1 >= 0 ? '+' : ''}${(pose.angle1 * 180 / Math.PI).toFixed(1)}°`;
    $('#jointTwoValue').textContent = `${pose.angle2 >= 0 ? '+' : ''}${(pose.angle2 * 180 / Math.PI).toFixed(1)}°`;
    $('#telemetryX').textContent = pose.end.x.toFixed(2);
    $('#telemetryY').textContent = pose.end.y.toFixed(2);
    $('#telemetryElbow').textContent = pose.angle2 >= 0 ? 'UP' : 'DOWN';
    $('#telemetryStatus').textContent = pose.reachable ? 'READY' : 'LIMIT';
    $('#twinReachability').textContent = pose.reachable ? 'TARGET REACHABLE' : 'TARGET CLAMPED';
  });
};
threeModuleReady.then(initialiseDigitalTwins);

$('#jointOne')?.addEventListener('input', event => labTwin?.setJointAngles(Number(event.target.value), Number($('#jointTwo').value)));
$('#jointTwo')?.addEventListener('input', event => labTwin?.setJointAngles(Number($('#jointOne').value), Number(event.target.value)));
$('#robotReset')?.addEventListener('click', () => { labTwin?.setJointAngles(20, 35); heroTwin?.setJointAngles(20, 35); });
$('#robotSequence')?.addEventListener('click', async event => {
  const button = event.currentTarget; button.disabled = true; button.textContent = 'SEQUENCE RUNNING…';
  await threeModuleReady;
  if (labTwin) await labTwin.runSequence();
  button.disabled = false; button.innerHTML = 'RUN PICK SEQUENCE <span>↗</span>';
});

// PLC seal-in circuit with a separate emergency-stop chain.
(() => {
  let running = false, estop = false, startPulse = false, scan = 1, pulseTimer = 0;
  const paint = () => {
    $('#plcIndicator').classList.toggle('on', running);
    $('#plcState').textContent = estop ? 'SAFETY TRIPPED' : running ? 'MOTOR RUNNING' : 'MOTOR STOPPED';
    $('#startContact').classList.toggle('active', startPulse);
    $('#holdContact').classList.toggle('active', running);
    $('#motorCoil').classList.toggle('active', running);
    $('#stopContact').classList.toggle('active', !estop);
    $('#scanCount').textContent = String(scan).padStart(4, '0');
    $('#ioStart').textContent = startPulse ? 'PULSE' : 'LOW'; $('#ioStart').classList.toggle('high', startPulse);
    $('#ioStop').textContent = 'HEALTHY'; $('#ioStop').classList.add('high');
    $('#ioEstop').textContent = estop ? 'TRIPPED' : 'CLEAR'; $('#ioEstop').classList.toggle('trip', estop);
    $('#ladderFeedback').textContent = estop ? 'E-STOP active. Safety chain open; output forced OFF.' : running ? 'M0.0 is latched. Holding contact maintains Q0.0.' : 'Run bit is FALSE. Output is de-energised.';
    $('#plcEstop').textContent = estop ? 'CLEAR E-STOP' : 'E-STOP';
  };
  const transition = next => { running = next && !estop; startPulse = false; scan++; paint(); };
  $('#plcStart').addEventListener('click', () => {
    if (estop) return;
    running = true; startPulse = true; scan++; paint();
    clearTimeout(pulseTimer); pulseTimer = setTimeout(() => { startPulse = false; scan++; paint(); }, 320);
  });
  $('#plcStop').addEventListener('click', () => transition(false));
  $('#plcReset').addEventListener('click', () => transition(false));
  $('#plcEstop').addEventListener('click', () => { estop = !estop; if (estop) running = false; startPulse = false; scan++; paint(); });
  paint();
})();

// Transparent, deterministic process model for the portfolio's waste sorter.
(() => {
  const scenarios = {
    plastic: { object: 'PLASTIC', class: 'PLASTIC · 0.91', bin: 'BIN 01', bars: [88, 32, 18] },
    organic: { object: 'ORGANIC', class: 'ORGANIC · 0.89', bin: 'BIN 02', bars: [25, 89, 14] },
    ewaste: { object: 'E-WASTE', class: 'E-WASTE · 0.93', bin: 'BIN 03', bars: [16, 20, 93] },
    recyclable: { object: 'RECYCLABLE', class: 'RECYCLABLE · 0.87', bin: 'BIN 04', bars: [31, 24, 87] }
  };
  const input = $('.vision-input'), model = $('.vision-model'), output = $('.vision-output');
  $('#visionRun').addEventListener('click', async event => {
    const key = $('#wasteSelect').value, data = scenarios[key], button = event.currentTarget;
    button.disabled = true; button.textContent = 'PROCESSING…';
    [input, model, output].forEach(el => el.classList.remove('processed'));
    $('#visionObject').textContent = 'FRAME CAPTURED'; $('#visionClass').textContent = 'INFERENCE RUNNING'; $('#visionRoute').textContent = 'ROUTE PENDING';
    await new Promise(r => setTimeout(r, 380)); input.classList.add('processed');
    $('#visionObject').textContent = data.object;
    await new Promise(r => setTimeout(r, 450)); model.classList.add('processed');
    $('#visionClass').textContent = data.class;
    $$('.confidence-bars i').forEach((bar, i) => bar.style.setProperty('--w', `${data.bars[i]}%`));
    await new Promise(r => setTimeout(r, 380)); output.classList.add('processed'); $('#visionRoute').textContent = data.bin;
    button.disabled = false; button.innerHTML = 'PROCESS FRAME ↗';
  });
})();

// Project case files: authored details, not auto-generated claims.
const caseFiles = {
  waste: { kicker: 'CASE FILE / 001 · VISION + EMBEDDED', title: 'Automatic waste sorter', summary: 'A prototype that connects custom-trained waste recognition with a physical sorting mechanism. The ESP32-CAM provides the camera input; a laptop performs YOLO inference and maps the predicted class to servo movement.', details: [['PERCEPTION', 'Custom YOLO model trained around plastic, organic, e-waste and recyclable categories.'], ['HARDWARE', 'ESP32-CAM, two servo motors and a collector / bin mechanism.'], ['DATA FLOW', 'Image capture → model inference → category decision → actuator command.'], ['ENGINEERING FOCUS', 'Making a software classification produce a predictable physical action.']], tags: ['YOLO', 'PYTHON', 'ESP32-CAM', 'SERVO CONTROL', 'COMPUTER VISION'] },
  areca: { kicker: 'CASE FILE / 002 · MECHANICAL DESIGN', title: 'Areca palm climbing robot', summary: 'A mechanical design exploration for climbing and harvesting on an areca palm. CAD work focused on the enclosure, wheel interaction, a spring-based gripper concept and motion-oriented checks.', details: [['DESIGN INTENT', 'Explore a climbing robot layout for a vertical agricultural surface.'], ['CAD', 'Fusion 360 modelling and assembly.'], ['MECHANISM', 'Wheel geometry and a spring-based gripping concept.'], ['ENGINEERING FOCUS', 'Think through contact, stability, fit and motion before fabrication.']], tags: ['FUSION 360', 'CAD', 'MECHANISM DESIGN', 'MOTION STUDY'] },
  sorting: { kicker: 'CASE FILE / 003 · INDUSTRIAL VISION', title: 'Vision-based sorting automation', summary: 'A sorting automation concept using Python and OpenCV to inspect objects and sensor-triggered pneumatic actuation to move them. The work considered response timing and mechanical alignment.', details: [['PERCEPTION', 'Python / OpenCV image processing.'], ['SEQUENCE', 'Sensor-triggered decision and actuation sequence.'], ['ACTUATION', 'Pneumatic pusher concept.'], ['ENGINEERING FOCUS', 'Coordinate visual inspection with physical timing.']], tags: ['PYTHON', 'OPENCV', 'PNEUMATICS', 'SENSORS'] },
  mimic: { kicker: 'CASE FILE / 004 · ROBOTICS', title: 'Mimic robotic arm', summary: 'A microcontroller-based arm that follows operator motion through sensor inputs and servo outputs. The build explores mapping sensed movement to coordinated joint motion.', details: [['INPUT', 'Sensor-based operator movement.'], ['CONTROL', 'Microcontroller signal handling and mapping.'], ['OUTPUT', 'Coordinated servo actuation across arm joints.'], ['ENGINEERING FOCUS', 'Repeatable movement and stable control response.']], tags: ['ARDUINO', 'SERVO', 'SENSORS', 'ROBOTICS'] },
  human: { kicker: 'CASE FILE / 005 · EDGE AI', title: 'Human detection for disaster response', summary: 'A Jetson Nano computer-vision exploration aimed at recognising people in camera imagery. It examines how inference can be brought closer to the sensing hardware.', details: [['COMPUTE', 'NVIDIA Jetson Nano.'], ['PERCEPTION', 'Human detection in camera frames.'], ['SOFTWARE', 'Python-based vision workflow.'], ['ENGINEERING FOCUS', 'Edge inference and practical scene detection.']], tags: ['JETSON NANO', 'PYTHON', 'VISION', 'EDGE AI'] },
  plc: { kicker: 'CASE FILE / 006 · INDUSTRIAL CONTROL', title: 'PLC sequencing & conveyor logic', summary: 'A group of PLC programming and simulation exercises that include ladder logic, I/O configuration, interlocks, sensor-based sequence steps and drive-control simulation.', details: [['PLATFORM', 'Siemens PLC learning with TIA Portal; CODESYS practice.'], ['LOGIC', 'Ladder logic, seal-in circuits, sequencing and interlocks.'], ['SIMULATION', 'Factory I/O, Modbus mapping and output checks.'], ['ENGINEERING FOCUS', 'Trace the I/O signal path and debug the process step by step.']], tags: ['TIA PORTAL', 'CODESYS', 'FACTORY I/O', 'LADDER LOGIC'] },
  idcard: { kicker: 'CASE FILE / 007 · COMPUTER VISION', title: 'Student ID-card detection', summary: 'A computer-vision concept for detecting whether a student is wearing an ID card and linking the event to a student-information workflow. The intended flow includes flagging missing-card events for an administrator.', details: [['MODEL', 'YOLO-based ID-card detection concept.'], ['VISION', 'Image-based card presence recognition.'], ['WORKFLOW', 'Detection event linked to student details.'], ['INTEGRATION IDEA', 'Administrative notification for a missing-card event.']], tags: ['YOLOV8', 'PYTHON', 'DATABASE', 'AUTOMATION'] },
  dobot: { kicker: 'CASE FILE / 008 · ROBOT KINEMATICS', title: 'Dobot Magician kinematic analysis', summary: 'A study of robot geometry, joint parameters and end-effector motion. The work connects forward and inverse kinematics reasoning to reachability and movement constraints.', details: [['PLATFORM', 'Dobot Magician.'], ['ANALYSIS', 'Forward and inverse kinematics.'], ['METHOD', 'Joint-space and Cartesian-position reasoning.'], ['ENGINEERING FOCUS', 'Understand reachability and end-effector position.']], tags: ['DOBOT', 'KINEMATICS', 'MATLAB', 'ROBOTICS'] },
  plant: { kicker: 'CASE FILE / 009 · EMBEDDED IoT', title: 'Smart plant monitoring', summary: 'An ESP8266-based plant monitoring prototype connecting sensor readings to a Blynk IoT dashboard, exploring remote visibility of basic plant-condition data.', details: [['CONTROLLER', 'ESP8266.'], ['CONNECTIVITY', 'Wi-Fi connection and Blynk IoT dashboard.'], ['SENSING', 'Plant-condition sensor inputs.'], ['ENGINEERING FOCUS', 'Connect a physical sensor reading to a remote interface.']], tags: ['ESP8266', 'BLYNK', 'IoT', 'SENSORS'] }
};
(() => {
  const modal = $('#caseModal');
  const close = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); };
  const open = key => {
    const item = caseFiles[key]; if (!item) return;
    $('#caseKicker').textContent = item.kicker; $('#caseTitle').textContent = item.title; $('#caseSummary').textContent = item.summary;
    $('#caseDetails').innerHTML = item.details.map(([label, value]) => `<div class="case-detail"><b>${escapeHTML(label)}</b><span>${escapeHTML(value)}</span></div>`).join('');
    $('#caseTags').innerHTML = item.tags.map(tag => `<span>${escapeHTML(tag)}</span>`).join('');
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); $('.case-close').focus();
  };
  $$('.case-open').forEach(button => button.addEventListener('click', () => open(button.dataset.case)));
  $$('[data-close-case]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
})();
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }

// Project filters and free-text search.
(() => {
  const cards = $$('.project-card'), search = $('#projectSearch'), empty = $('#projectEmpty');
  let activeFilter = 'all';
  const update = () => {
    const q = search.value.trim().toLowerCase(); let count = 0;
    cards.forEach(card => {
      const categories = card.dataset.category.split(' ');
      const text = `${card.dataset.search} ${card.innerText}`.toLowerCase();
      const visible = (activeFilter === 'all' || categories.includes(activeFilter)) && (!q || text.includes(q));
      card.hidden = !visible; if (visible) count++;
    });
    empty.hidden = count > 0;
  };
  $$('.filter-button').forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter; $$('.filter-button').forEach(el => el.classList.toggle('active', el === button)); update();
  }));
  search.addEventListener('input', update);
})();

// Read-only public repository radar. It never requests credentials.
(() => {
  const list = $('#repoList'), status = $('#repoStatus');
  fetch('https://api.github.com/users/arjunrose/repos?sort=updated&per_page=100', { headers: { Accept: 'application/vnd.github+json' } })
    .then(response => { if (!response.ok) throw new Error(`GitHub API ${response.status}`); return response.json(); })
    .then(repositories => {
      const chosen = repositories.filter(repo => !repo.fork).sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at)).slice(0, 4);
      status.textContent = 'SYNC COMPLETE';
      if (!chosen.length) throw new Error('No public repositories returned');
      list.innerHTML = chosen.map(repo => `<article class="repo-item"><a href="${escapeHTML(repo.html_url)}" target="_blank" rel="noreferrer">${escapeHTML(repo.name)} ↗</a><small>${escapeHTML(repo.language || 'SOURCE')}</small><p>${escapeHTML(repo.description || 'Public project repository')}</p></article>`).join('');
    })
    .catch(() => {
      status.textContent = 'PROFILE LINK READY';
      list.innerHTML = '<article class="repo-item"><a href="https://github.com/arjunrose?tab=repositories" target="_blank" rel="noreferrer">Browse all public repositories ↗</a><small>GITHUB</small><p>Repository preview is unavailable right now. Open the profile to explore the complete project archive.</p></article>';
    });
})();


// Recruiter cut: a guided jump to the strongest evidence, without hiding any work.
(() => {
  const button = $('#recruiterMode');
  if (!button) return;
  button.addEventListener('click', () => {
    button.classList.add('active'); button.innerHTML = 'RECRUITER ROUTE <span>✓</span>';
    document.getElementById('journey')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    setTimeout(() => { button.classList.remove('active'); button.innerHTML = 'RECRUITER CUT <span>↗</span>'; }, 2600);
  });
})();

// Contact form: safe mailto handoff for a static GitHub Pages deployment.
(() => {
  const form = $('#contactForm');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim(), email = String(data.get('email') || '').trim();
    const topic = String(data.get('topic') || 'Portfolio enquiry'), message = String(data.get('message') || '').trim();
    if (!name || !email || !message) { $('#contactStatus').textContent = 'Please complete all required fields.'; return; }
    const subject = encodeURIComponent(`${topic} — ${name}`);
    const body = encodeURIComponent(`Hello Arjun,\n\n${message}\n\nFrom: ${name}\nEmail: ${email}`);
    $('#contactStatus').textContent = 'Opening your email application with the message prepared.';
    window.location.href = `mailto:arjunrose2005@gmail.com?subject=${subject}&body=${body}`;
  });
})();

// Keyboard command palette (Ctrl/Cmd + K).
(() => {
  const overlay = $('#commandOverlay'), input = $('#commandInput'), list = $('#commandList');
  const open = () => { overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false'); input.value = ''; filter(''); input.focus(); };
  const close = () => { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); };
  const filter = query => {
    const q = query.trim().toLowerCase();
    $$('button,a', list).forEach(item => { item.hidden = q && !item.textContent.toLowerCase().includes(q); });
  };
  $('#commandTrigger').addEventListener('click', open);
  $$('[data-close-command]').forEach(el => el.addEventListener('click', close));
  input.addEventListener('input', () => filter(input.value));
  $$('[data-target]', list).forEach(button => button.addEventListener('click', () => { const target = button.dataset.target; close(); document.getElementById(target)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' }); }));
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); open(); }
    if (event.key === 'Escape') close();
  });
})();

$('#currentYear').textContent = new Date().getFullYear();
