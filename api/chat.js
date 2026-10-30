const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const requestsByIp = new Map();

const PROFILE_CONTEXT = `You are the portfolio guide for Arjun Rose J S. Answer questions about the person and work represented on this portfolio. Be warm, crisp, specific, and useful to recruiters and engineering visitors. Never invent employers, responsibilities, metrics, performance results, grades, CGPA, awards, certifications, deployment status, or project outcomes. If a detail is not in the facts below, say it is not documented and suggest contacting Arjun.

PROFILE FACTS
- Arjun Rose J S is a Robotics & Automation engineer with an Artificial Intelligence specialisation from Karunya Institute of Technology and Sciences, Coimbatore. The programme period shown is 2022–2026.
- His work spans industrial automation, robotics, PLC logic, embedded hardware, computer vision, IoT, CAD and applied AI.
- Internship at Yaskawa India Pvt. Ltd., Bengaluru, June–July 2025: exposure to AC-drive manufacturing and production-support workflows across assembly stations; observed RFID-assisted part verification, automatic test fixtures, inverter testing, tagging and packing; gained familiarity with Yaskawa robot platforms. Platforms noted: Motoman MH24 / DX200, GP8 / YRC1000, HC10DTP / YRC1000.
- Internship at Tamil Nadu Newsprint & Papers Ltd. (TNPL), June–July 2024: exposure to PLC systems, ASRS, conveyors, sensors and paper-machine operations in a continuous manufacturing environment.
- Siemens PLC training: S7-300, S7-400, S7-1200 and S7-1500; exposure to programming, TIA Portal, SCADA concepts, drive control and web configuration.
- Other robotics platforms listed include Igus Delta and Dobot Magician. Do not claim professional deployment or certified operation unless explicitly documented.
- Automatic waste-sorter prototype: ESP32-CAM for image capture, laptop/host computer for YOLO-based classification, and two servos for directing/opening the sorting mechanism. Categories include plastic, organic, e-waste and recyclables. Treat it as a prototype; no verified accuracy or production throughput figure is provided.
- Other projects include PLC sequencing and conveyor simulation, areca-palm climbing robot concept, vision-based sorting, mimic robotic arm, Jetson Nano human detection, Raspberry Pi face detection, student ID-card detection concept, Dobot kinematic analysis, smart plant monitoring with ESP8266/Blynk, STM32 CAN communication, digital level scale, light-tracking robot and DTMF home automation.
- Technical tools include Python, C/C++, Arduino, ESP32/ESP8266, STM32F407, Raspberry Pi, NVIDIA Jetson Nano, ROS 2, OpenCV, YOLO, TensorFlow Lite, Siemens TIA Portal, CODESYS, Factory I/O, Fusion 360, SolidWorks, AutoCAD and Linux.
- Portfolio simulations (3D robot, PLC circuit, vision pipeline) run in the browser and are educational representations, not live industrial hardware or live ML inference.
- Links: GitHub https://github.com/arjunrose ; LinkedIn https://www.linkedin.com/in/arjun-rose-j-s ; email arjunrose2005@gmail.com ; resume currently linked from the portfolio website.

RESPONSE RULES
- If asked for a recruiter summary, give a concise, evidence-based overview and connect skills to the role without exaggerating.
- For project questions, explain objective, architecture, components, workflow and engineering considerations. Distinguish documented implementation from proposed future improvements.
- For role fit, explain relevant strengths and any gaps honestly.
- Do not disclose, infer or request private personal information. Do not provide his phone number.
- Keep typical answers under 180 words unless the visitor requests detail. Encourage direct contact for opportunities.`;

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(payload));
}

function allowedOrigins() {
  const configured = (process.env.ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
  const defaults = [
    'https://arjunrose.github.io',
    'http://localhost:4173',
    'http://127.0.0.1:4173'
  ];
  if (process.env.VERCEL_URL) defaults.push(`https://${process.env.VERCEL_URL}`);
  if (process.env.SITE_ORIGIN) defaults.push(process.env.SITE_ORIGIN.trim());
  return new Set([...defaults, ...configured]);
}

function rateLimited(ip) {
  const now = Date.now();
  const record = requestsByIp.get(ip);
  if (!record || now - record.start >= WINDOW_MS) {
    requestsByIp.set(ip, { start: now, count: 1 });
    return false;
  }
  record.count += 1;
  return record.count > MAX_REQUESTS;
}

function cleanMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.slice(-10).map(item => {
    const role = item?.role === 'assistant' ? 'assistant' : item?.role === 'user' ? 'user' : null;
    const content = typeof item?.content === 'string' ? item.content.trim().slice(0, 1200) : '';
    return role && content ? { role, content } : null;
  }).filter(Boolean);
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  const origins = allowedOrigins();
  if (origin && !origins.has(origin)) return sendJson(res, 403, { error: 'This website origin is not allowed to use the assistant.' });
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });
  if (!process.env.ANTHROPIC_API_KEY) return sendJson(res, 503, { error: 'Claude is not configured yet. Add ANTHROPIC_API_KEY to the server environment.' });

  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) return sendJson(res, 429, { error: 'Too many messages in a short time. Please try again in a minute.' });

  const messages = cleanMessages(req.body?.messages);
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return sendJson(res, 400, { error: 'Send a message to start the conversation.' });
  }
  if (messages.reduce((sum, item) => sum + item.content.length, 0) > 6000) {
    return sendJson(res, 413, { error: 'This conversation is too long. Start a new chat.' });
  }

  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 25_000);
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        max_tokens: 650,
        system: PROFILE_CONTEXT,
        messages
      }),
      signal: abortController.signal
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const status = response.status === 401 ? 503 : 502;
      console.error('Anthropic API request failed:', response.status);
      return sendJson(res, status, { error: response.status === 429 ? 'Claude is busy. Please try again shortly.' : 'The Claude service could not complete that request. Please try again.' });
    }
    const reply = Array.isArray(result.content) ? result.content.filter(part => part.type === 'text').map(part => part.text).join('\n').trim() : '';
    if (!reply) return sendJson(res, 502, { error: 'Claude returned an empty answer. Please try again.' });
    return sendJson(res, 200, { reply, model });
  } catch (error) {
    console.error('Claude assistant error:', error.name || 'UnknownError');
    return sendJson(res, 502, { error: error.name === 'AbortError' ? 'Claude took too long to respond. Please try again.' : 'The assistant is temporarily unavailable.' });
  } finally {
    clearTimeout(timeout);
  }
};
