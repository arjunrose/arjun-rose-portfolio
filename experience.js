const portalSpaces = {
  motion: {
    kicker: 'DISCIPLINE / 01 · MOTION',
    title: 'Robot motion & kinematics',
    description: 'Explore how joint-space movement becomes a precise end-effector position. Includes a browser-based 2-link inverse-kinematics model and hands-on Dobot Magician kinematic analysis.',
    a: '2-DOF', al: 'INTERACTIVE MODEL', b: 'XYZ / XY', bl: 'POSE REASONING', target: '#lab'
  },
  vision: {
    kicker: 'DISCIPLINE / 02 · PERCEPTION',
    title: 'Visual intelligence',
    description: 'Follow a perception-to-action pipeline: camera capture, object classification and a servo-directed route. It reflects the architecture explored in the automatic waste-sorter prototype.',
    a: 'YOLO', al: 'OBJECT DETECTION', b: 'EDGE → HOST', bl: 'SYSTEM ARCHITECTURE', target: '#lab'
  },
  control: {
    kicker: 'DISCIPLINE / 03 · CONTROL',
    title: 'Industrial control systems',
    description: 'Discover the logic behind sequence control, interlocks, I/O mapping and PLC-driven machinery, supported by Siemens training and factory simulation exercises.',
    a: 'S7 × 4', al: 'PLC FAMILIES', b: 'I/O → LOGIC', bl: 'CONTROL FLOW', target: '#lab'
  },
  design: {
    kicker: 'DISCIPLINE / 04 · MECHATRONICS',
    title: 'Mechanical & embedded design',
    description: 'Connect the physical build with the electronic system: CAD mechanisms, sensor integration, microcontroller logic and actuation across prototypes such as the mimic arm and climbing robot concept.',
    a: 'CAD', al: 'MECHANICAL DESIGN', b: 'MCU / IO', bl: 'HARDWARE INTEGRATION', target: '#projects'
  }
};

(() => {
  const root = document.documentElement;
  const stage = document.getElementById('portalStage');
  if (!stage) return;
  const buttons = [...document.querySelectorAll('[data-space]')];
  const core = document.getElementById('portalCore');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeSpace = 'motion';

  function selectSpace(key) {
    const data = portalSpaces[key];
    if (!data) return;
    activeSpace = key;
    buttons.forEach(button => {
      const active = button.dataset.space === key;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    });
    document.getElementById('portalKicker').textContent = data.kicker;
    document.getElementById('portalTitleDetail').textContent = data.title;
    document.getElementById('portalDescription').textContent = data.description;
    document.getElementById('portalMetricA').textContent = data.a;
    document.getElementById('portalMetricALabel').textContent = data.al;
    document.getElementById('portalMetricB').textContent = data.b;
    document.getElementById('portalMetricBLabel').textContent = data.bl;
    if (core) {
      core.dataset.space = key;
      core.animate?.([{ transform: 'scale(.96) rotate(-4deg)', opacity: .68 }, { transform: 'scale(1) rotate(0)', opacity: 1 }], { duration: reducedMotion ? 1 : 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => selectSpace(button.dataset.space));
    if (button.classList.contains('portal-step')) {
      button.addEventListener('keydown', event => {
        if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
        event.preventDefault();
        const steps = [...document.querySelectorAll('.portal-step')];
        const next = (index + (event.key === 'ArrowDown' ? 1 : -1) + steps.length) % steps.length;
        steps[next].focus(); steps[next].click();
      });
    }
  });
  document.getElementById('portalExplore')?.addEventListener('click', () => {
    document.querySelector(portalSpaces[activeSpace].target)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  });

  // Subtle interactive parallax responds to pointer movement without hijacking scroll.
  stage.addEventListener('pointermove', event => {
    if (reducedMotion || event.pointerType === 'touch') return;
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    core?.style.setProperty('--portal-x', `${x * 9}px`);
    core?.style.setProperty('--portal-y', `${y * 9}px`);
    if (core) core.style.transform = `translate3d(${x * 8}px,${y * 8}px,0) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { if (core) core.style.transform = ''; }, { passive: true });

  // Lightweight procedural star/connection field for the atlas.
  const canvas = document.getElementById('portalCanvas');
  const ctx = canvas?.getContext('2d');
  if (canvas && ctx) {
    let width = 0, height = 0, raf = 0, points = [], last = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      width = rect.width; height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(26, Math.min(72, Math.floor(width / 9)));
      points = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width, y: Math.random() * height,
        r: .5 + Math.random() * 1.1, phase: Math.random() * Math.PI * 2,
        speed: .12 + Math.random() * .42, anchor: i % 8 === 0
      }));
    };
    const draw = time => {
      if (!reducedMotion) raf = requestAnimationFrame(draw);
      if (reducedMotion && time - last < 120) return;
      last = time;
      ctx.clearRect(0, 0, width, height);
      const drift = time * .00008;
      points.forEach((p, i) => {
        const x = p.x + Math.sin(drift * p.speed + p.phase) * 7;
        const y = p.y + Math.cos(drift * p.speed + p.phase) * 7;
        ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.anchor ? 'rgba(214,255,79,.62)' : 'rgba(112,229,212,.42)'; ctx.fill();
        for (let j = i + 1; j < points.length; j++) {
          const q = points[j], dx = x - q.x, dy = y - q.y, d = Math.hypot(dx, dy);
          if (d < Math.min(105, width * .19)) {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(112,229,212,${(1 - d / 105) * .13})`; ctx.lineWidth = .65; ctx.stroke();
          }
        }
      });
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(stage);
    if (!reducedMotion) raf = requestAnimationFrame(draw); else draw(0);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reducedMotion) raf = requestAnimationFrame(draw);
    });
  }
  selectSpace('motion');
})();

// Claude portfolio guide. API key is never present in client-side code.
(() => {
  const launcher = document.getElementById('claudeLauncher');
  const panel = document.getElementById('claudePanel');
  const close = document.getElementById('claudeClose');
  const form = document.getElementById('claudeForm');
  const input = document.getElementById('claudeInput');
  const send = document.getElementById('claudeSend');
  const thread = document.getElementById('claudeMessages');
  const prompts = document.getElementById('claudePrompts');
  if (!launcher || !panel || !form || !input || !thread || !send) return;

  const githubPages = /(^|\.)github\.io$/i.test(location.hostname);
  const endpoint = String(window.ARJUN_CLAUDE_ENDPOINT || (githubPages ? '' : '/api/chat')).trim();
  const history = [];
  let busy = false;

  function setOpen(open) {
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    launcher.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('claude-open', open);
    if (open) setTimeout(() => input.focus(), 180);
  }
  launcher.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
  close?.addEventListener('click', () => { setOpen(false); launcher.focus(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel.classList.contains('open')) setOpen(false);
  });

  function addMessage(role, text, extraClass = '') {
    const node = document.createElement('div');
    node.className = `claude-message ${role}${extraClass ? ` ${extraClass}` : ''}`;
    node.textContent = text;
    thread.appendChild(node);
    thread.scrollTop = thread.scrollHeight;
    return node;
  }
  function typing() {
    const node = document.createElement('div'); node.className = 'claude-message assistant';
    node.innerHTML = '<span class="claude-typing" aria-label="Claude is thinking"><i></i><i></i><i></i></span>';
    thread.appendChild(node); thread.scrollTop = thread.scrollHeight; return node;
  }
  function setBusy(value) {
    busy = value; send.disabled = value; input.disabled = value;
    send.textContent = value ? '…' : '↗';
  }
  async function ask(question) {
    const text = String(question || '').trim();
    if (!text || busy) return;
    addMessage('user', text);
    input.value = ''; input.style.height = 'auto';
    if (!endpoint) {
      addMessage('assistant', 'The Claude assistant is ready in this build, but the API endpoint is not configured for this GitHub Pages deployment yet. Deploy this same project to Vercel with ANTHROPIC_API_KEY set as a server-side environment variable, or set ARJUN_CLAUDE_ENDPOINT in assistant-config.js to your deployed Vercel /api/chat URL. Your API key must never be placed in browser code.', 'error');
      return;
    }
    history.push({ role: 'user', content: text });
    const pending = typing(); setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-10) })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Assistant service returned ${response.status}.`);
      const reply = String(data.reply || '').trim();
      if (!reply) throw new Error('Claude returned an empty response. Please try again.');
      history.push({ role: 'assistant', content: reply });
      pending.remove(); addMessage('assistant', reply);
    } catch (error) {
      pending.remove();
      const message = error instanceof TypeError
        ? 'Could not reach the Claude service. Check that the Vercel API is deployed and its origin is allowed.'
        : (error.message || 'The assistant is temporarily unavailable.');
      addMessage('assistant', message, 'error');
    } finally { setBusy(false); input.focus(); }
  }
  form.addEventListener('submit', event => { event.preventDefault(); ask(input.value); });
  input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 100)}px`; });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
  });
  prompts?.addEventListener('click', event => {
    const button = event.target.closest('[data-prompt]');
    if (button) { setOpen(true); ask(button.dataset.prompt); }
  });
})();
