const recent = new Map();

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { RESEND_API_KEY, CONTACT_TO, CONTACT_FROM } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO || !CONTACT_FROM) {
    return res.status(503).json({ error: 'Contact service is not configured.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  // Honeypot field: silently accept automated submissions without forwarding them.
  if (body.website) return res.status(200).json({ ok: true });

  const name = String(body.name || '').trim().slice(0, 100);
  const email = String(body.email || '').trim().slice(0, 180);
  const topic = String(body.topic || 'Portfolio enquiry').trim().slice(0, 100);
  const message = String(body.message || '').trim().slice(0, 3000);

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid name, email and message.' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const previous = recent.get(ip) || [];
  const recentRequests = previous.filter((time) => now - time < 60_000);
  if (recentRequests.length >= 5) return res.status(429).json({ error: 'Please wait before sending another message.' });
  recent.set(ip, [...recentRequests, now]);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: CONTACT_FROM,
        to: [CONTACT_TO],
        reply_to: email,
        subject: `Portfolio enquiry — ${topic}`,
        text: `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`,
        html: `<h2>Portfolio enquiry</h2><p><b>Name:</b> ${escapeHtml(name)}</p><p><b>Email:</b> ${escapeHtml(email)}</p><p><b>Topic:</b> ${escapeHtml(topic)}</p><hr/><p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>`
      })
    });
    if (!response.ok) {
      const details = await response.text();
      return res.status(502).json({ error: 'Email provider rejected the message.', details: details.slice(0, 300) });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(502).json({ error: 'Unable to deliver the message right now.' });
  }
};
