/* ============================================================
   elevenlabs.js — Voice synthesis (Kayla)
   Calls /api/voice serverless proxy — key never hits browser.
============================================================ */

let kaiVoiceEnabled = true;
let currentAudio    = null;

function handleVoiceToggle(el) {
  kaiVoiceEnabled = !el.classList.contains('on');
  if (!kaiVoiceEnabled && currentAudio) {
    try { currentAudio.pause(); } catch(e) {}
    currentAudio = null;
  }
}

async function kaiSpeak(text) {
  if (!kaiVoiceEnabled) return;
  const clean = text
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
  if (!clean || clean.length < 2) return;
  try {
    const res = await fetch('/api/voice', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text: clean })
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    if (currentAudio) { try { currentAudio.pause(); } catch(e) {} }
    currentAudio = new Audio(url);
    currentAudio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; };
    currentAudio.play().catch(() => {});
  } catch(e) {}
}
