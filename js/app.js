
  // ── LOGIN ────────────────────────────────────────────────

  function handleGoogleLogin() {
    dismissLogin();
  }

  function handleEmailLogin() {
    const email = document.getElementById('login-email')?.value.trim();
    const pass  = document.getElementById('login-password')?.value;
    if (!email || !pass) {
      shakeLoginBtn();
      return;
    }
    dismissLogin();
  }

  function handleForgotPassword() {
    const email = document.getElementById('login-email')?.value.trim();
    const layer = document.getElementById('layer-login');
    if (layer) {
      const msg = email
        ? `A reset link has been sent to ${email}.`
        : 'Enter your email above, then tap Forgot password.';
      const sub = layer.querySelector('.login-sub');
      if (sub) {
        sub.textContent = msg;
        sub.style.color = email ? 'rgba(34,197,94,0.85)' : 'rgba(255,165,0,0.85)';
      }
    }
  }

  function dismissLogin() {
    const layer = document.getElementById('layer-login');
    if (layer) layer.classList.add('hidden');
    setTimeout(() => { if (layer) layer.style.display = 'none'; }, 520);
  }

  function shakeLoginBtn() {
    const btn = document.querySelector('.login-submit-btn');
    if (!btn) return;
    btn.style.transition = 'transform 0.08s ease';
    const steps = [6, -6, 4, -4, 0];
    steps.forEach((x, i) => setTimeout(() => btn.style.transform = `translateX(${x}px)`, i * 80));
    setTimeout(() => btn.style.transform = '', 440);
  }

  // ── LAYER NAVIGATION ────────────────────────────────────

  let chatOpen = false;
  const openOverlays = [];

  // ── EDU BANNERS ─────────────────────────────────────────
  const eduTopics = {
    leads:     { reply: "Lead management is how you track and respond to new business inquiries. I flag new leads, score them by urgency, and draft responses — you just approve or edit.", label: 'Leads', overlayId: 'overlay-leads' },
    approvals: { reply: "The approval system is how I keep you in control. Before I send anything on your behalf — a reply, a proposal, a follow-up — I surface it here for your sign-off.", label: 'Approvals', overlayId: 'overlay-approvals' },
    agents:    { reply: "AI agents are always-on automations running in the background for your businesses. Each one handles a specific job — responding to leads, sending briefings, managing follow-ups — without you lifting a finger.", label: 'AI Agents', overlayId: 'overlay-agents' },
    tasks:     { reply: "Tasks are how I track what needs to get done across your businesses. I create them automatically from conversations, approvals, and agent activity — and prioritize them so you always know what's next.", label: 'Tasks', overlayId: 'overlay-tasks' },
    companies: { reply: "Your companies are managed separately so I can keep data, leads, revenue, and agents organized by business. You can switch context at the top or view everything together.", label: 'Companies', overlayId: 'overlay-companies' },
    calendar:  { reply: "I read your calendar to understand your availability, flag scheduling conflicts, and help your agents book meetings automatically. Everything syncs in real time.", label: 'Calendar', overlayId: 'overlay-calendar' },
    reports:   { reply: "Business Health shows your revenue, lead volume, and conversion rate across all your companies. It updates as your agents work so you always have a live snapshot.", label: 'Reports', overlayId: 'overlay-reports' },
    usage:     { reply: "Your Usage screen shows how many messages you've sent today and this month against your plan limits. Each model uses a different amount — Haiku is lightest, Opus uses the most. Staying on Sonnet for everyday tasks keeps your usage healthy.", label: 'Usage', overlayId: 'overlay-settings-usage' },
                        plan:      { reply: `Every AcaiOS plan includes all 12 AI agents. The only difference is volume.<br><br><strong>Kai — $97/mo</strong><br>Voice, text &amp; email · 100 calls · 500 messages · 1 company<br><br><strong>Starter — $497/mo</strong><br>Voice, text &amp; email · 100 calls · 500 messages · 1 company<br><br><strong>Growth — $1,497/mo</strong><br>Voice, text &amp; email · 500 calls · Unlimited messages · 3 companies<br><br><strong>Autonomy — $2,497/mo</strong><br>Unlimited calls &amp; messages · Unlimited companies · Auto-Approve Mode<br><br>All plans month to month. No contracts.`, label: 'Plan & Billing', overlayId: 'overlay-settings-plan', options: [{label: '\u2192  Starter \u2014 $497/mo', intent: 'I want to upgrade to the Starter plan'}, {label: '\u2192  Growth \u2014 $1,497/mo', intent: 'I want to upgrade to the Growth plan'}, {label: '\u2192  Autonomy \u2014 $2,497/mo', intent: 'I want to upgrade to the Autonomy plan'}] },
    connectors: { reply: "Connectors link AcaiOS to the tools your businesses already use — Google Workspace, HubSpot, Shopify, Xero, and more. Once connected, I can read real emails, real revenue, and real leads instead of demo data. You stay in control of what I can access.", label: 'Connectors', overlayId: 'overlay-settings-integrations' },
    about: { reply: `Imagine walking away from your business — going on vacation, spending time with your family, focusing on something new — and everything still runs. Leads still get answered. Appointments still get booked. Customers still get followed up with. Revenue still comes in.<br><br>That's what AcaiOS does.<br><br><strong>Kai</strong> is your AI — working across all your companies, around the clock, so you don't have to.<br><br><strong>12 AI agents</strong> handle your business automatically:<br><br><strong>Every new lead gets a response</strong> — within 60 seconds, by call, text, or email. No more missed opportunities because nobody got back to them in time.<br><br><strong>Appointments get booked and confirmed</strong> — Kai handles the back and forth, sends reminders, and takes care of rescheduling without you touching it.<br><br><strong>New customers get taken care of</strong> — Kai welcomes them, answers their questions, and makes sure they know exactly what to expect from day one.<br><br><strong>Past customers come back</strong> — Kai reaches out to people who haven't heard from you in a while and gives them a reason to return.<br><br><strong>Money gets collected</strong> — Kai follows up on unpaid invoices professionally, so you're not the one making awkward calls.<br><br><strong>Your reputation grows</strong> — after every service, Kai asks happy customers to leave a review. Unhappy ones get handled privately before it goes public.<br><br><strong>You stay in control</strong> — anything important gets surfaced here for your approval. You make the call from your phone in seconds.<br><br>Your business runs itself. What would you like to know more about?`, label: null, overlayId: null },
    supervisor: { reply: `The Operations Supervisor is the manager of all agents. It doesn't replace you — it protects you.<br><br><strong>What it watches:</strong> Every outbound call, text, and email before or after it goes out. Every call transcript in real time. Every agent action logged against your business rules.<br><br><strong>What it flags:</strong> Risky language. Angry or escalating customers. Incorrect promises. Approval rules that weren't followed. Failed workflows. Repeated agent mistakes.<br><br><strong>What it escalates directly to you:</strong> Any legal, medical, or financial language. Any mention of money, guarantees, contracts, or service commitments. Any threat or compliance issue. Any customer who sounds upset.<br><br><strong>In Live Escalation and Gatekeeper modes</strong>, the Supervisor listens to active calls in real time and can interrupt immediately — before damage is done.<br><br>Every flagged issue creates an audit log. You always know what happened, when, and why.`, label: null, overlayId: null },
    invoice: { reply: 'Invoice &amp; Billing Agent creates, sends, and tracks invoices automatically. It follows up on overdue payments by email and SMS — day 1, day 7, day 14 — and escalates to you if unpaid past your threshold. Every invoice logged. Nothing chased manually.', label: null, overlayId: null },
    stripe: { reply: 'Stripe Revenue Agent gives AcaiOS real-time awareness of every dollar moving through your business — successful payments, failed charges, subscription renewals, refunds, and revenue trends. It does not replace your accountant. It makes sure you always know what\'s happening with your money.', label: null, overlayId: null },
    xero: { reply: 'Xero Bookkeeping Agent organizes your bookkeeping visibility and preps your financial records. It flags uncategorized transactions, syncs invoices to Xero, and generates monthly summaries. It does not file taxes, provide legal advice, or replace your accountant.', label: null, overlayId: null },
    financialnotifications: { reply: 'Financial Notifications surfaces real-time financial alerts directly inside AcaiOS — invoice paid, payment failed, invoice overdue, revenue increased, subscription renewed, bookkeeping summary ready. Your financial pulse, always visible, without checking another app.', label: null, overlayId: null },
    models: { reply: `Your messages are powered by Claude, Anthropic's AI. You choose which model runs each conversation.\n\n<strong>Haiku 4.5</strong> is the fastest and lightest. Best for quick questions and simple tasks — uses the fewest tokens.\n\n<strong>Sonnet 4.6</strong> is the sweet spot. Fast, smart, handles complex work. This is what Kai uses by default.\n\n<strong>Opus 4.6</strong> is the most powerful. Use it for deep strategy, complex proposals, and high-stakes decisions — it uses the most tokens.\n\nTokens are like fuel — every message burns some. Lighter models stretch your plan further. Heavier models go deeper.`, label: null, overlayId: null },
  };

  function openEduChat(topicKey) {
    const topic = eduTopics[topicKey];
    if (!topic) return;
    const sourceOverlayId = topic.overlayId;
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
    openOverlays.length = 0;
    openChat();
    setTimeout(() => {
      if (topicKey === 'about') {
        const kaiMsg = addChatMsg('acai', 'Here\'s what AcaiOS does for your business.');
        addAboutToChat(kaiMsg);
        return;
      }
      if (topicKey === 'supervisor') {
        const kaiMsg = addChatMsg('acai', 'Here\'s how the Operations Supervisor works.');
        addSupervisorLearnMoreToChat(kaiMsg);
        return;
      }
      addChatMsg('acai', topic.reply, topic.label || null, sourceOverlayId || null, topic.options || null);
      scrollChatToBottom();
      if (topic.label && sourceOverlayId) {
        setTimeout(() => {
          const messages = document.getElementById('chat-messages');
          if (!messages) return;
          const div = document.createElement('div');
          div.className = 'chat-msg acai';
          div.innerHTML = `<div class="chat-sender">Kai</div><div class="chat-bubble">What else would you like to know?</div><div class="chat-time">Now</div>`;
          messages.appendChild(div);
          messages.scrollTop = messages.scrollHeight;
        }, 900);
      }
    }, 450);
  }

  function addSupervisorLearnMoreToChat(kaiMsg) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    const paragraphs = [
      { bold: 'What it watches:', text: ' Every outbound call, text, and email before or after it goes out. Every call transcript in real time. Every agent action logged against your business rules.' },
      { bold: 'What it flags:', text: ' Risky language. Angry or escalating customers. Incorrect promises. Approval rules that weren\'t followed. Failed workflows. Repeated agent mistakes.' },
      { bold: 'What it escalates directly to you:', text: ' Any legal, medical, or financial language. Any mention of money, guarantees, contracts, or service commitments. Any threat or compliance issue. Any customer who sounds upset.' },
      { bold: 'In Live Escalation and Gatekeeper modes:', text: ' The Supervisor listens to active calls in real time and can interrupt immediately — before damage is done.' },
      { bold: null, text: 'Every flagged issue creates an audit log. You always know what happened, when, and why.' },
    ];

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai'; wrapper.dataset.type = 'supervisor';

    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:0;width:100%;margin-top:4px;';

    const fullText = `<strong style="color:var(--text-primary);">What it watches:</strong> Every outbound call, text, and email before or after it goes out. Every call transcript in real time. Every agent action logged against your business rules.<br><br><strong style="color:var(--text-primary);">What it flags:</strong> Risky language. Angry or escalating customers. Incorrect promises. Approval rules that weren't followed. Failed workflows. Repeated agent mistakes.<br><br><strong style="color:var(--text-primary);">What it escalates directly to you:</strong> Any legal, medical, or financial language. Any mention of money, guarantees, contracts, or service commitments. Any threat or compliance issue. Any customer who sounds upset.<br><br><strong style="color:var(--text-primary);">In Live Escalation and Gatekeeper modes:</strong> The Supervisor listens to active calls in real time and can interrupt immediately — before damage is done.<br><br>Every flagged issue creates an audit log. You always know what happened, when, and why.`;

    const card = document.createElement('div');
    card.className = 'agent-card';
    card.style.cssText = 'opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';
    card.onclick = function() { toggleAgentCard(this); };
    card.innerHTML = `
      <div class="agent-card-top">
        <div class="agent-card-name">Operations Supervisor</div>
        <svg class="agent-card-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="agent-card-preview" style="display:block;">What it watches · What it flags · What it escalates · Live monitoring</div>
      <div class="agent-card-tap-hint"><span class="agent-card-tap-hint-label">Expand</span></div>
      <div class="agent-card-body">
        <div class="agent-card-action">${fullText}</div>
      </div>`;
    cardsWrap.appendChild(card);
    const allItems = [card];

    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.innerHTML = '<span class="chat-section-bar-title">Operations Supervisor</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);

    const time = document.createElement('div');
    time.className = 'chat-time';
    time.textContent = 'Now';

    wrapper.appendChild(sectionBar);
    wrapper.appendChild(sectionBody);
    wrapper.appendChild(time);
    messages.appendChild(wrapper);

    requestAnimationFrame(() => {
      if (kaiMsg) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = kaiMsg.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
      }
    });

    allItems.forEach((el, i) => {
      setTimeout(() => { el.style.opacity = ''; el.style.transform = ''; }, 120 + i * 80);
    });
  }

  function addAboutToChat(kaiMsg) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai'; wrapper.dataset.type = 'about';

    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:0;width:100%;margin-top:4px;';

    const card = document.createElement('div');
    card.className = 'agent-card';
    card.style.cssText = 'opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;cursor:default;';
    card.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;padding:28px 20px 24px;gap:20px;width:100%;box-sizing:border-box;">
        <div style="width:64px;height:64px;border-radius:18px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
        </div>
        <div style="text-align:center;">
          <div style="font-size:18px;font-weight:700;color:var(--text-primary);letter-spacing:-0.02em;">AcaiOS</div>
          <div style="font-size:13px;color:var(--text-tertiary);margin-top:4px;">Your AI-powered business OS</div>
        </div>
        <div style="width:100%;background:rgba(255,255,255,0.042);border:1px solid rgba(255,255,255,0.055);border-radius:16px;overflow:hidden;">
          <div style="padding:14px 16px;">
            <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:8px;">Support</div>
            <div style="font-size:14px;color:var(--text-secondary);">hello@acaios.io</div>
            <div style="font-size:14px;color:var(--text-secondary);margin-top:4px;">(917) 673-1999</div>
          </div>
          
          <div style="padding:14px 16px;">
            <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:8px;">Legal</div>
            <div style="font-size:14px;color:var(--text-secondary);">acaios.io/terms</div>
            <div style="font-size:14px;color:var(--text-secondary);margin-top:4px;">acaios.io/privacy</div>
          </div>
        </div>
        <div style="font-size:12px;color:var(--text-tertiary);">© 2026 AcaiOS · v187</div>
      </div>`;
    cardsWrap.appendChild(card);

    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.innerHTML = '<span class="chat-section-bar-title">About AcaiOS</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);

    const time = document.createElement('div');
    time.className = 'chat-time';
    time.textContent = 'Now';

    wrapper.appendChild(sectionBar);
    wrapper.appendChild(sectionBody);
    wrapper.appendChild(time);
    messages.appendChild(wrapper);

    requestAnimationFrame(() => {
      if (kaiMsg) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = kaiMsg.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
      }
    });

    setTimeout(() => { card.style.opacity = ''; card.style.transform = ''; }, 120);
  }

  // ── SETTINGS → CHAT injection ──────────────────────────────────────────
  // ── SETTINGS CARD HTML BUILDERS ────────────────────────────────────────
  // No DOM cloning — each card is built from scratch so overlay padding never bleeds in.

  const S = ``;
  const SL = `<div style="height:1px;background:rgba(0,0,0,0.06);margin:4px 0;"></div>`;
  function sRow(icon, title, sub, rightHTML) {
    return `<div style="display:flex;align-items:center;gap:14px;padding:16px;background:rgba(255,255,255,0.042);border:1px solid rgba(255,255,255,0.055);border-radius:22px;">
      <div style="width:44px;height:44px;border-radius:16px;background:rgba(255,255,255,0.065);border:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${icon}</div>
      <div style="flex:1;min-width:0;"><div style="font-size:17px;font-weight:760;letter-spacing:-0.025em;color:var(--text-primary);">${title}</div>${sub ? `<div style="font-size:13px;color:rgba(255,255,255,0.48);margin-top:4px;line-height:1.38;">${sub}</div>` : ''}</div>
      ${rightHTML || ''}
    </div>`;
  }
  function sRowPlain(icon, title, sub, rightHTML) {
    return `<div style="display:flex;align-items:center;gap:14px;padding:16px;">
      <div style="width:44px;height:44px;border-radius:16px;background:rgba(255,255,255,0.065);border:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${icon}</div>
      <div style="flex:1;min-width:0;"><div style="font-size:17px;font-weight:760;letter-spacing:-0.025em;color:var(--text-primary);">${title}</div>${sub ? `<div style="font-size:13px;color:rgba(255,255,255,0.48);margin-top:4px;line-height:1.38;">${sub}</div>` : ''}</div>
      ${rightHTML || ''}
    </div>`;
  }
  function toggle(id) {
    const el = document.getElementById(id);
    const on = el && el.classList.contains('on');
    return `<div id="${id}" class="settings-toggle-track${on ? ' on' : ''}" style="flex-shrink:0;" onclick="this.classList.toggle('on')"><div class="settings-toggle-thumb"></div></div>`;
  }
  function btn(label, onclick) {
    return `<button onclick="${onclick}" style="width:100%;padding:16px;background:rgba(255,255,255,0.042);border:1px solid rgba(255,255,255,0.055);border-radius:22px;font-family:var(--font);font-size:17px;font-weight:760;letter-spacing:-0.025em;color:var(--text-primary);cursor:pointer;">${label}</button>`;
  }
  function field(label, val, ph) {
    return `<div style="display:flex;flex-direction:column;gap:6px;">
      <div style="font-size:13px;color:var(--text-tertiary);">${label}</div>
      <input type="text" ${val ? `value="${val}"` : ''} ${ph ? `placeholder="${ph}"` : ''} style="width:100%;padding:13px 15px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:12px;font-family:var(--font);font-size:15px;color:var(--text-primary);outline:none;box-sizing:border-box;"/>
    </div>`;
  }
  function connRow(icon, name, sub) {
    return `<div style="display:flex;align-items:center;gap:14px;padding:8px 0;">
      ${icon}
      <div style="flex:1;"><div style="font-size:15px;color:var(--text-primary);">${name}</div><div style="font-size:13px;color:var(--text-tertiary);">${sub}</div></div>
      <button onclick="sendChatWithIntent('Configure ${name}')" style="padding:6px 14px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.12);border-radius:10px;font-family:var(--font);font-size:13px;font-weight:600;color:var(--text-primary);cursor:pointer;flex-shrink:0;">Connect</button>
    </div>`;
  }
  function iconBox(bg, svg) {
    return `<div style="width:44px;height:44px;border-radius:12px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">${svg}</div>`;
  }
  function usageBar(used, total, label, reset) {
    const pct = Math.round((used/total)*100);
    return `<div style="background:rgba(255,255,255,0.06);border-radius:14px;padding:16px;">
      <div style="font-size:16px;font-weight:600;color:var(--text-primary);margin-bottom:10px;">${label}</div>
      <div style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin-bottom:8px;">
        <div style="width:${pct}%;height:100%;background:#FF9500;border-radius:2px;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-secondary);">
        <span>${used} of ${total} messages used</span><span style="color:var(--text-tertiary);">${reset}</span>
      </div>
    </div>`;
  }

  const settingsCardHTML = {
    profile: () => `
      <div style="background:rgba(255,255,255,0.042);border:1px solid rgba(255,255,255,0.055);border-radius:22px;padding:20px;display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:4px 0;">
          <div style="width:64px;height:64px;border-radius:50%;background:#A8A29E;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;">TT</div>
          <div style="font-size:18px;font-weight:600;color:var(--text-primary);">Tony Terry</div>
        </div>
        
        ${field('Full name', 'Tony Terry')}
        ${field('What should Kai call you?', 'Tony')}
        ${btn('Update Profile', '')}
      </div>
      <div style="background:rgba(255,255,255,0.042);border:1px solid rgba(255,255,255,0.055);border-radius:22px;padding:20px;display:flex;flex-direction:column;gap:12px;">
        <div style="font-size:15px;font-weight:500;color:var(--text-primary);">What preferences should Kai consider?</div>
        <div style="font-size:13px;color:var(--text-tertiary);margin-top:-6px;">Applies to every conversation.</div>
        <textarea rows="3" placeholder="e.g. Always lead with revenue impact. Keep responses brief." style="width:100%;padding:13px 15px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:12px;font-family:var(--font);font-size:14px;color:var(--text-primary);outline:none;resize:none;box-sizing:border-box;"></textarea>
        ${btn('Save Preferences', '')}
      </div>
      <div style="background:rgba(255,69,58,0.06);border:1px solid rgba(255,69,58,0.15);border-radius:22px;padding:16px;display:flex;align-items:center;gap:12px;cursor:pointer;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF453A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        <span style="font-size:15px;color:#FF453A;">Delete Account</span>
      </div>`,

    agents: () => `
      <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:8px;">KAI AUTONOMY</div>
      <div style="background:rgba(255,255,255,0.042);border:1px solid rgba(255,255,255,0.055);border-radius:22px;overflow:hidden;">
        <div class="autonomy-wrap">
          <div class="autonomy-label-title">How much freedom does Kai have?</div>
          <div class="autonomy-label-sub">Controls when Kai acts vs. when it checks with you first.</div>
          <div class="autonomy-track" onclick="handleAutonomyClick(event,this)">
            <div class="autonomy-thumb" data-level="${kaiAutonomyLevel}"></div>
            <div class="autonomy-segment${kaiAutonomyLevel===0?' active':''}" data-level="0">Ask First</div>
            <div class="autonomy-segment${kaiAutonomyLevel===1?' active':''}" data-level="1">Balanced</div>
            <div class="autonomy-segment${kaiAutonomyLevel===2?' active':''}" data-level="2">Full Auto</div>
          </div>
        </div>
      </div>
      <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin:16px 0 8px;">NOTIFICATIONS & APPROVALS</div>
      <div style="background:rgba(255,255,255,0.042);border:1px solid rgba(255,255,255,0.055);border-radius:22px;overflow:hidden;">
        ${sRowPlain('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>',
          'Manual Approvals', 'Agents ask for approval before sending anything',
          '<div id="chat-toggle-approvals" data-demo="true" title="Demo state — behavior wired at backend" class="settings-toggle-track on" style="flex-shrink:0;" onclick="this.classList.toggle(\'on\')"><div class="settings-toggle-thumb"></div></div>')}
        
        ${sRowPlain('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
          'Priority Notifications', 'Alerts for hot leads and urgent actions',
          '<div id="chat-toggle-notifs" data-demo="true" title="Demo state — behavior wired at backend" class="settings-toggle-track on" style="flex-shrink:0;" onclick="this.classList.toggle(\'on\')"><div class="settings-toggle-thumb"></div></div>')}
        
        ${sRowPlain('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
          'Quiet Hours', 'No alerts between 10 PM – 7 AM',
          '<div id="chat-toggle-quiet" data-demo="true" title="Demo state — behavior wired at backend" class="settings-toggle-track" style="flex-shrink:0;" onclick="this.classList.toggle(\'on\')"><div class="settings-toggle-thumb"></div></div>')}
      </div>
      <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin:16px 0 8px;">CALL BEHAVIOR</div>
      <div style="background:rgba(255,255,255,0.042);border:1px solid rgba(255,255,255,0.055);border-radius:22px;overflow:hidden;">
        ${sRowPlain('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
          'Auto-Answer Calls', 'Inbound Agent picks up every call automatically',
          '<div id="chat-toggle-autoanswer" data-demo="true" title="Demo state — behavior wired at backend" class="settings-toggle-track on" style="flex-shrink:0;" onclick="this.classList.toggle(\'on\')"><div class="settings-toggle-thumb"></div></div>')}
        
        ${sRowPlain('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
          'Business Hours', 'Outbound calls · Mon–Fri 8AM–7PM',
          '<span style="font-size:13px;color:var(--text-tertiary);flex-shrink:0;">Edit</span>')}
        
        ${sRowPlain('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
          'Escalation', 'Forward to Tony if Kai cannot handle it',
          '<div id="chat-toggle-escalation" data-demo="true" title="Demo state — behavior wired at backend" class="settings-toggle-track on" style="flex-shrink:0;" onclick="this.classList.toggle(\'on\')"><div class="settings-toggle-thumb"></div></div>')}
      </div>`,

    connectors: () => {
      function cIcon(bg, svg) { return `<div style="width:44px;height:44px;border-radius:12px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">${svg}</div>`; }
      function cRow(icon, name, sub) { return `<div style="display:flex;align-items:center;gap:14px;padding:12px 16px;">${icon}<div style="flex:1;min-width:0;"><div style="font-size:15px;color:var(--text-primary);">${name}</div><div style="font-size:13px;color:var(--text-tertiary);">${sub}</div></div><button onclick="sendChatWithIntent('Configure ${name}')" style="padding:6px 14px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.12);border-radius:10px;font-family:var(--font);font-size:13px;font-weight:600;color:var(--text-primary);cursor:pointer;flex-shrink:0;">Connect</button></div>`; }
      const twilio = cIcon('#F22F46','<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#F22F46"/><circle cx="12" cy="12" r="2.5" fill="white"/><circle cx="12" cy="5.5" r="1.8" fill="white"/><circle cx="12" cy="18.5" r="1.8" fill="white"/><circle cx="5.5" cy="12" r="1.8" fill="white"/><circle cx="18.5" cy="12" r="1.8" fill="white"/></svg>');
      const el11 = cIcon('#FFBA00','<svg width="18" height="18" viewBox="0 0 24 24"><rect width="24" height="24" rx="3" fill="#FFBA00"/><rect x="5" y="4" width="3.5" height="16" rx="1.75" fill="#0A0A0A"/><rect x="10.5" y="4" width="3.5" height="16" rx="1.75" fill="#0A0A0A"/><rect x="16" y="7" width="3" height="10" rx="1.5" fill="#0A0A0A"/></svg>');
      const google = cIcon('#EA4335','<svg width="18" height="18" viewBox="0 0 24 24"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.548l8.073-6.055C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/></svg>');
      const hubspot = cIcon('#FF5C35','<svg width="18" height="18" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#FF5C35"/><path d="M43 30v20a12 12 0 1 0 6 0V30H43z" fill="white"/><circle cx="63" cy="62" r="9" fill="white"/></svg>');
      const shopify = cIcon('#95BF47','<svg width="18" height="18" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#95BF47"/><text x="5" y="18" font-size="14" fill="white" font-family="serif" font-style="italic">S</text></svg>');
      const stripe = cIcon('#635BFF','<svg width="18" height="18" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#635BFF"/><path d="M11.5 9.5c0-.8.7-1.1 1.8-1.1 1.6 0 3.2.5 4.7 1.3V6.3c-1.6-.6-3.1-1-4.7-1-3.9 0-6.5 2-6.5 5.5 0 5.3 7.3 4.4 7.3 6.7 0 .9-.8 1.2-1.8 1.2-1.6 0-3.6-.7-5.2-1.6v3.8c1.8.8 3.6 1.1 5.2 1.1 4 0 6.7-2 6.7-5.5-.1-5.7-7.5-4.7-7.5-7z" fill="white"/></svg>');
      const xero = cIcon('#1DC471','<svg width="18" height="18" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#1DC471"/><path d="M7.5 12l3-3 1.2 1.2-3 3 3 3L10.5 17.4l-3-3-3 3L3.3 16.2l3-3-3-3L4.5 8.8l3 3zM16.5 12l-3-3-1.2 1.2 3 3-3 3 1.2 1.2 3-3 3 3 1.2-1.2-3-3 3-3-1.2-1.2-3 3z" fill="white"/></svg>');
      const notion = cIcon('#000','<svg width="18" height="18" viewBox="0 0 24 24"><rect x="1" y="1" width="22" height="22" rx="4" fill="white"/><path d="M6.5 6.2h5l6 8.3V6.2H19V18h-4.5L8.5 9.7V18H7V6.2H6.5z" fill="#0A0A0A"/></svg>');
      const ig = cIcon('linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)','<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>');
      const fb = cIcon('#1877F2','<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>');
      const D = ``;
      const CS = '<div style="background:rgba(255,255,255,0.042);border:1px solid rgba(255,255,255,0.055);border-radius:22px;padding:8px 0;">';
      const CE = '</div>';
      return `
      <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:8px;">COMMUNICATION</div>
      ${CS}${cRow(twilio,'Twilio','Calls · SMS')}${D}${cRow(el11,'ElevenLabs','Voice synthesis')}${CE}
      <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin:16px 0 8px;">PRODUCTIVITY</div>
      ${CS}${cRow(google,'Gmail','Email · Calendar')}${D}${cRow(hubspot,'HubSpot','CRM · Leads · Deals')}${D}${cRow(shopify,'Shopify','Twizted Vybz · GFT')}${CE}
      <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin:16px 0 8px;">FINANCE</div>
      ${CS}${cRow(stripe,'Stripe','Payments · Invoices')}${D}${cRow(xero,'Xero','Accounting · Revenue')}${D}${cRow(notion,'Notion','Docs · Knowledge base')}${CE}
      <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin:16px 0 8px;">SOCIAL</div>
      ${CS}${cRow(ig,'Instagram','DMs · Comments · Leads')}${D}${cRow(fb,'Facebook','Page · Ads · Messenger')}${CE}
      <div style="font-size:13px;color:var(--text-tertiary);padding-top:8px;">Connect your tools so Kai has live data — real emails, real revenue, real leads.</div>`;
    },

    usage: () => `
      <div style="background:rgba(255,255,255,0.042);border:1px solid rgba(255,255,255,0.055);border-radius:22px;overflow:hidden;">
        ${sRowPlain('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
          'This Month', '<div style="height:3px;background:rgba(255,255,255,0.1);border-radius:2px;margin-top:6px;"><div style="width:14%;height:100%;background:#FF9500;border-radius:2px;"></div></div><div style="font-size:13px;color:var(--text-tertiary);margin-top:5px;">42 of 300 messages · Resets Jun 1</div>',
          '<span style="font-size:13px;font-weight:600;color:var(--text-primary);flex-shrink:0;">42<span style="font-size:11px;font-weight:400;color:var(--text-tertiary);">/300</span></span>')}
        
        ${sRowPlain('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
          'Current Session', '<div style="height:3px;background:rgba(255,255,255,0.1);border-radius:2px;margin-top:6px;"><div style="width:20%;height:100%;background:#FF9500;border-radius:2px;"></div></div><div style="font-size:13px;color:var(--text-tertiary);margin-top:5px;">4 of 20 messages · Resets next session</div>',
          '<span style="font-size:13px;font-weight:600;color:var(--text-primary);flex-shrink:0;">4<span style="font-size:11px;font-weight:400;color:var(--text-tertiary);">/20</span></span>')}
      </div>
      <div style="font-size:13px;color:var(--text-tertiary);padding-top:2px;">Need more messages? Contact your AcaiOS administrator to upgrade your plan.</div>`,

    billing: () => `
      <div style="background:rgba(255,255,255,0.042);border:1px solid rgba(255,255,255,0.055);border-radius:22px;overflow:hidden;">
        ${sRowPlain('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
          'Kai Plan', '<div style="font-size:13px;color:var(--text-tertiary);margin-top:4px;">All 12 agents · Voice, text &amp; email · 100 calls/mo · 500 messages/mo · 1 company</div>',
          '<span style="font-size:18px;font-weight:700;color:var(--text-primary);flex-shrink:0;">$97<span style="font-size:11px;font-weight:400;color:var(--text-tertiary);">/mo</span></span>')}
        
        ${sRowPlain('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
          'Next Billing', '<div style="font-size:13px;color:var(--text-tertiary);margin-top:4px;">June 1, 2026</div>',
          '<span style="font-size:18px;font-weight:700;color:var(--text-primary);flex-shrink:0;">$97</span>')}
      </div>
      ${btn('Upgrade Plan', "sendChatWithIntent('I want to upgrade my plan')")}`,

    preferences: () => `
      <div style="background:rgba(255,255,255,0.042);border:1px solid rgba(255,255,255,0.055);border-radius:22px;overflow:hidden;">
        ${sRowPlain('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
          'Speak Responses', 'Kai reads responses aloud in Kayla\'s voice',
          '<div id="chat-tog-voice" class="settings-toggle-track ' + (kaiVoiceEnabled ? 'on' : '') + '" style="flex-shrink:0;" onclick="handleVoiceToggle(this);this.classList.toggle(\'on\')"><div class="settings-toggle-thumb"></div></div>')}${sRowPlain('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
          'Screen Guides', 'Show swipe hints on overlays',
          '<div id="chat-tog-guides" class="settings-toggle-track on" style="flex-shrink:0;" onclick="handleGuidesToggle(this);this.classList.toggle(\'on\')"><div class="settings-toggle-thumb"></div></div>')}
      </div>`,

    legal: () => `
      <div style="background:rgba(255,255,255,0.042);border:1px solid rgba(255,255,255,0.055);border-radius:22px;padding:20px;display:flex;flex-direction:column;gap:14px;">
        <div><div style="font-size:15px;font-weight:600;color:var(--text-primary);margin-bottom:4px;">AI-Generated Content</div><div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">AcaiOS is powered by AI. All content generated by Kai may contain errors. Always verify before acting on it.</div></div>
        
        <div><div style="font-size:15px;font-weight:600;color:var(--text-primary);margin-bottom:4px;">You Are Responsible</div><div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">Before acting on AI-generated information, you are solely responsible for reviewing and verifying its accuracy.</div></div>
        
        <div><div style="font-size:15px;font-weight:600;color:var(--text-primary);margin-bottom:4px;">Not Professional Advice</div><div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">Nothing in AcaiOS constitutes legal, financial, medical, or professional advice of any kind.</div></div>
        
        <div style="font-size:13px;color:var(--text-tertiary);">AcaiOS · acaios.io · Last updated May 2026</div>
      </div>`
  };

  function injectSettingsChat(key) {
    const intros = {
      profile:     "Here's your profile. Update your name and how Kai should address you.",
      agents:      'Agent controls — manage approvals and notifications for every agent.',
      connectors:  "Connect your tools so Kai has live data instead of demo data.",
      usage:       "Here's your current usage across this month and session.",
      billing:     'Your plan and billing details. All plans are month-to-month.',
      preferences: 'Preferences — theme, display options, and how I behave.',
      legal:       'Legal disclaimer and terms of use for AcaiOS.'
    };
    const titles = {
      profile:'Profile', agents:'Agent Controls', connectors:'Connectors',
      usage:'Usage', billing:'Billing', preferences:'Preferences', legal:'Legal'
    };
    const intro = intros[key];
    const buildHTML = settingsCardHTML[key];
    const title = titles[key] || key;
    if (!intro || !buildHTML) return;

    closeDrawer();
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
    if (typeof openOverlays !== 'undefined') openOverlays.length = 0;
    openChat();

    // Mirror addAgentCardsToChat exactly:
    // 1. rAF → append typing indicator + scroll to bottom
    // 2. setTimeout 900ms → remove typing, addChatMsg returns kaiMsg, append card, rAF scroll to kaiMsg
    requestAnimationFrame(() => {
      const messages = document.getElementById('chat-messages');
      if (!messages) return;

      const typing = document.createElement('div');
      typing.className = 'chat-msg acai'; typing.dataset.type = 'kai';
      typing.id = 'typing-indicator-settings';
      typing.innerHTML = '<div class="chat-sender">Kai</div><div class="chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
      messages.appendChild(typing);
      messages.scrollTop = messages.scrollHeight;

      setTimeout(() => {
        document.getElementById('typing-indicator-settings')?.remove();

        // addChatMsg returns the element — same as agents kaiMsg
        const kaiMsg = addChatMsg('acai', intro);

        const messages2 = document.getElementById('chat-messages');
        if (!messages2) return;

        // Build settings card
        const card = document.createElement('div');
        card.className = 'chat-msg acai';
        card.innerHTML = `<div class="agent-card open" onclick="toggleAgentCard(this)">
          <div class="agent-card-top">
            <div class="agent-card-name" style="font-size:15px;">${title}</div>
            <svg class="agent-card-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="agent-card-body" style="gap:12px;">${buildHTML()}</div>
        </div><div class="chat-time">Now</div>`;
        messages2.appendChild(card);

        // Force reflow for open animation
        const agentCard = card.querySelector('.agent-card');
        if (agentCard) {
          agentCard.classList.remove('open');
          void agentCard.offsetHeight;
          agentCard.classList.add('open');
        }

        // Exact scroll from addAgentCardsToChat — scroll to kaiMsg, not the card
        requestAnimationFrame(() => {
          const msgsRect = messages2.getBoundingClientRect();
          const msgRect = kaiMsg.getBoundingClientRect();
          messages2.scrollTop = messages2.scrollTop + (msgRect.top - msgsRect.top) - 16;
        });

      }, 900);
    });
  }

  function scrollChatToBottom() {
    const msgs = document.getElementById('chat-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
    const btn = document.getElementById('scroll-to-bottom-btn');
    if (btn) btn.classList.remove('visible');
  }

  // Snaps the chat so the user's message sits at the top of the viewport.
  // Uses getBoundingClientRect — correct inside position:fixed containers.
  function scrollUserMsgToTop(userMsgEl) {
    const msgs = document.getElementById('chat-messages');
    if (!msgs || !userMsgEl) { scrollChatToBottom(); return; }
    const msgsRect = msgs.getBoundingClientRect();
    const msgRect = userMsgEl.getBoundingClientRect();
    msgs.scrollTop += msgRect.top - msgsRect.top - 16;
  }

  function checkScrollPosition() {
    const msgs = document.getElementById('chat-messages');
    const btn = document.getElementById('scroll-to-bottom-btn');
    if (!msgs || !btn) return;
    const atBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 60;
    btn.classList.toggle('visible', !atBottom);
  }

  function openCompanyDropdown() {
    const overlay = document.getElementById('company-sheet-overlay');
    const sheet = document.getElementById('company-sheet');
    const chevron = document.getElementById('company-chevron');
    overlay.style.display = 'block';
    sheet.style.display = 'block';
    if (chevron) chevron.style.transform = 'rotate(180deg)';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      sheet.style.transform = 'translateX(-50%) translateY(0)';
    }));
  }

  function closeCompanyDropdown() {
    const sheet = document.getElementById('company-sheet');
    const chevron = document.getElementById('company-chevron');
    sheet.style.transform = 'translateX(-50%) translateY(100%)';
    if (chevron) chevron.style.transform = 'rotate(0deg)';
    setTimeout(() => {
      document.getElementById('company-sheet-overlay').style.display = 'none';
      sheet.style.display = 'none';
    }, 280);
  }

  function selectCompany(id, label, color) {
    // Update trigger button
    document.getElementById('company-label').textContent = label;
    document.getElementById('company-dot').style.background = color;
    // Hide all checks
    ['all','dkr','realty','capital','gft','streetwear','healthcare'].forEach(c => {
      const el = document.getElementById('check-' + c);
      if (el) el.style.display = 'none';
    });
    // Show selected check
    const check = document.getElementById('check-' + id);
    if (check) check.style.display = 'block';
    // Filter health tab
    setHealthTab(id, null);
    closeCompanyDropdown();
  }

  function toggleAudio(audioId, btnId) {
    const audio = document.getElementById(audioId);
    const btn = document.getElementById(btnId);
    const iconId = btnId.replace('play-btn-', 'play-icon-');
    const icon = document.getElementById(iconId);
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      icon.innerHTML = '<rect x="6" y="4" width="4" height="16" fill="white"/><rect x="14" y="4" width="4" height="16" fill="white"/>';
    } else {
      audio.pause();
      icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3" fill="white" stroke="none"/>';
    }
  }
  function updateScrubber(audioId, scrId, curId) {
    const audio = document.getElementById(audioId);
    const scr = document.getElementById(scrId);
    const cur = document.getElementById(curId);
    if (!audio || !scr) return;
    const pct = (audio.currentTime / audio.duration) * 204;
    scr.value = isNaN(pct) ? 0 : pct;
    const m = Math.floor(audio.currentTime / 60);
    const s = Math.floor(audio.currentTime % 60).toString().padStart(2,'0');
    if (cur) cur.textContent = m + ':' + s;
  }
  function seekAudio(audioId, val) {
    const audio = document.getElementById(audioId);
    if (!audio || !audio.duration) return;
    audio.currentTime = (val / 204) * audio.duration;
  }
  function resetAudio(btnId, iconId, scrId, curId) {
    const icon = document.getElementById(iconId);
    const scr = document.getElementById(scrId);
    const cur = document.getElementById(curId);
    if (icon) icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3" fill="white" stroke="none"/>';
    if (scr) scr.value = 0;
    if (cur) cur.textContent = '0:00';
  }

  function openCommOverlay(id) {
    document.getElementById(id).classList.add('open');
  }
  function closeCommOverlay(id) {
    document.getElementById(id).classList.remove('open');
  }

  function openTranscript(e) {
    e.stopPropagation();
    document.getElementById('overlay-transcript').classList.add('open');
  }
  function closeTranscript() {
    document.getElementById('overlay-transcript').classList.remove('open');
  }

  function setSupervisorMode(el, mode) {
    event.stopPropagation();
    document.querySelectorAll('.supervisor-mode-row').forEach(r => {
      r.style.background = 'rgba(255,255,255,0.04)';
      r.style.borderColor = 'rgba(255,255,255,0.08)';
      r.querySelector('div').style.background = 'rgba(255,255,255,0.2)';
    });
    el.style.background = 'rgba(10,132,255,0.1)';
    el.style.borderColor = 'rgba(10,132,255,0.3)';
    el.querySelector('div').style.background = '#0A84FF';
  }

  // Activity log data per agent type
  const agentActivityLog = {
    'Inbound Agent': [
      { icon: '📞', label: 'Answered call — Marcus Williams', time: '9:04 AM', action: "Show me the call transcript from Marcus Williams" },
      { icon: '📞', label: 'Answered call — David Chen', time: 'Yesterday 2:30 PM', action: "Show me the call transcript from David Chen" },
      { icon: '💬', label: 'SMS reply — Sandra Lee', time: '8:22 AM', action: "Show me the SMS to Sandra Lee" },
      { icon: '📧', label: 'Email — James Porter inquiry', time: 'Yesterday 9:00 AM', action: "Show me the email to James Porter" },
    ],
    'Speed to Lead': [
      { icon: '📞', label: 'Called Marcus Williams in 38 sec', time: '8:14 AM', action: "Show me the call transcript from Marcus Williams" },
      { icon: '📞', label: 'Called Sandra Lee in 42 sec', time: '8:51 AM', action: "Show me the call transcript from Sandra Lee" },
      { icon: '💬', label: 'SMS confirmation — Marcus Williams', time: '8:15 AM', action: "Show me the SMS to Marcus Williams" },
    ],
    'Outbound Agent': [
      { icon: '📧', label: 'Intro email sent — 8 contacts', time: '7:00 AM', action: "Show me the email to Marcus Williams" },
      { icon: '📞', label: '3 follow-up calls queued for 2PM', time: '7:00 AM', action: "Show me my tasks" },
      { icon: '💬', label: 'SMS sequence sent — 5 contacts', time: '7:01 AM', action: "Show me the SMS to Marcus Williams" },
    ],
    'Invoice & Billing Agent': [
      { icon: '🧾', label: 'Invoice INV-2026-004 sent — Riverside Medical $8,500', time: '8:15 AM', action: "Show me the invoice details" },
      { icon: '⏰', label: 'Follow-up reminder scheduled day 7', time: '8:15 AM', action: "Show me the invoice details" },
      { icon: '🧾', label: 'Invoice INV-2026-003 overdue reminder sent', time: 'Yesterday', action: "Show me the invoice details" },
    ],
    'Stripe Revenue Agent': [
      { icon: '💰', label: 'Payment received — $1,500 DKR client', time: '7:58 AM', action: "Show me the payment receipt" },
      { icon: '💰', label: 'Payment received — $950 Realty client', time: 'Yesterday 3:00 PM', action: "Show me the payment receipt" },
      { icon: '🔄', label: '1 subscription renewed — $750', time: 'Yesterday', action: "Show me the payment receipt" },
    ],
    'Xero Bookkeeping Agent': [
      { icon: '📊', label: 'Monthly summary generated and ready', time: 'Yesterday 6:00 PM', action: "Show me my bookkeeping summary" },
      { icon: '⚠️', label: '3 uncategorized expenses flagged', time: 'Yesterday 6:00 PM', action: "Show me my bookkeeping summary" },
      { icon: '✅', label: 'All invoices synced to Xero', time: 'Yesterday 6:01 PM', action: "Show me my bookkeeping summary" },
    ],
    'Financial Notifications': [
      { icon: '💰', label: '$1,500 payment received — DKR client', time: '7:58 AM', action: "Show me the payment receipt" },
      { icon: '🧾', label: 'Invoice sent to Riverside Medical', time: '8:15 AM', action: "Show me the invoice details" },
      { icon: '📊', label: 'Bookkeeping summary ready to review', time: 'Yesterday', action: "Show me my bookkeeping summary" },
    ],
    'Operations Supervisor': [
      { icon: '🚩', label: 'Flagged — Collections Agent message to Riverside Medical', time: '8:42 AM', action: "Show me the flagged message" },
      { icon: '✅', label: 'Reviewed 12 agent actions — all clear', time: '8:00 AM', action: "Show me my approvals" },
      { icon: '👁', label: 'Monitoring active call — Marcus Williams', time: '9:04 AM', action: "Show me the call transcript from Marcus Williams" },
    ],
  };

  let lastOpenedAgent = null; // tracks which agent card was last expanded

  function toggleAgentCard(card) {
    const wasOpen = card.classList.contains('open');
    card.classList.toggle('open');

    // Track which agent is open for back button
    if (!wasOpen) {
      const agentName = card.querySelector('.agent-card-name')?.textContent?.trim();
      if (agentName) lastOpenedAgent = { name: agentName, card };
    }

    // Inject activity log on first open for active agents
    if (!wasOpen && !card.dataset.activityInjected) {
      const agentName = card.querySelector('.agent-card-name')?.textContent?.trim();
      const isActive = card.querySelector('.agent-status.active');
      const body = card.querySelector('.agent-card-body');
      const log = agentActivityLog[agentName];

      if (isActive && body && log) {
        const existing = body.querySelector('.agent-activity-log');
        if (!existing) {
          const logEl = document.createElement('div');
          logEl.className = 'agent-activity-log';
          logEl.style.cssText = 'margin-top:14px;border-top:1px solid rgba(255,255,255,0.07);padding-top:12px;';
          logEl.innerHTML = `
            <div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:10px;">RECENT ACTIVITY — VIEW TRANSCRIPTS</div>
            ${log.map(item => `
              <div onclick="event.stopPropagation();handleActivityTap('${item.action}', '${item.label}')" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;" onmousedown="this.style.opacity='0.6'" onmouseup="this.style.opacity='1'">
                <span style="font-size:13px;flex-shrink:0;">${item.icon}</span>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13px;color:var(--text-primary);line-height:1.3;">${item.label}</div>
                  <div style="font-size:13px;color:var(--text-tertiary);margin-top:1px;">${item.time}</div>
                </div>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>`).join('')}
            <div onclick="event.stopPropagation();sendChatWithIntent('Show me my calls')" style="text-align:center;padding:8px 0 2px;font-size:11px;color:var(--text-tertiary);cursor:pointer;letter-spacing:0.04em;">View all activity →</div>`;
          body.appendChild(logEl);
        }
        card.dataset.activityInjected = 'true';
      }
    }
  }

  function openChat() {
    setTimeout(() => {
      const msgs = document.getElementById('chat-messages');
      if (msgs) {
        msgs.addEventListener('scroll', checkScrollPosition);
        msgs.scrollTop = msgs.scrollHeight;
      }
    }, 450);
    const chat = document.getElementById('layer-chat');
    chat.classList.add('open');
    chatOpen = true;
    // Notif panel stays open — closes via swipe left only
    // No auto-focus — keyboard only on deliberate tap
  }

  function closeChat() {
    const chat = document.getElementById('layer-chat');
    chat.classList.remove('open');
    chatOpen = false;
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
    openOverlays.length = 0;
    resetInputBar();
  }

  function handleGuidesToggle(row) {
    const track = document.getElementById('guides-toggle');
    if (!track) return;
    const isOn = track.classList.contains('on');
    track.classList.toggle('on', !isOn);
    // DEMO STATE ONLY — visual toggle only, no persistent behavior wired yet
    // Backend required to persist this preference across sessions
  }

  function resetInputBar() {
    const pill = document.querySelector('.input-bar');
    if (!pill) return;
    pill.classList.remove('active');
    const input = document.getElementById('acai-input');
    if (input) input.value = '';
  }

  function openOverlay(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    if (!openOverlays.includes(id)) openOverlays.push(id);
    if (!chatOpen) openChat();
    if (id === 'overlay-calendar') setTimeout(buildCalWeekStrip, 50);
    resetInputBar();
  }

  function closeOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
    const idx = openOverlays.indexOf(id);
    if (idx > -1) openOverlays.splice(idx, 1);
    resetInputBar();
  }

  function openChatWithIntent(text) {
    openChat();
    setTimeout(() => {
      const inp = document.getElementById('chat-input-field');
      if (inp) inp.value = text;
      sendChatMessage();
    }, 500);
  }

  function sendChatWithIntent(text) {
    // Close any open overlays so chat gets full screen
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
    openOverlays.length = 0;
    const inp = document.getElementById('chat-input-field');
    if (inp) inp.value = text;
    if (!chatOpen) {
      openChat();
      setTimeout(sendChatMessage, 500);
    } else {
      sendChatMessage();
    }
    // After content fires, scroll to the latest Kai bubble above the input bar
    setTimeout(() => {
      const messages = document.getElementById('chat-messages');
      const inputBar = document.getElementById('global-input-bar');
      if (!messages) return;
      const inputBarHeight = inputBar ? inputBar.getBoundingClientRect().height + 16 : 120;
      const kaiMsgs = messages.querySelectorAll('.chat-msg.acai');
      const last = kaiMsgs[kaiMsgs.length - 1];
      if (last) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = last.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - inputBarHeight;
      }
    }, 700);
  }

  // ── GLOBAL INPUT BAR ────────────────────────────────────

  function autoExpandTextarea(el) {
    const newH = Math.min(el.scrollHeight, 180);
    el.style.height = newH + 'px';
  }

  function handleGlobalInput(input) {
    const send = document.getElementById('input-send');
    const voice = document.getElementById('voice-circle-btn');
    const bar = document.getElementById('main-input-bar');
    const hasText = input.value.length > 0;
    if (send) send.style.display = hasText ? 'flex' : 'none';
    if (voice) voice.style.display = hasText ? 'none' : 'flex';
    if (bar) bar.classList.toggle('active', hasText);
  }

  function handleGlobalSend() {
    const input = document.getElementById('acai-input');
    const val = input ? input.value.trim() : '';
    if (!val) return;
    if (!chatOpen) {
      openChat();
      setTimeout(() => {
        const chatInput = document.getElementById('chat-input-field');
        if (chatInput) { chatInput.value = val; }
        if (input) input.value = '';
        handleGlobalInput(input);
        sendChatMessage();
      }, 450);
    } else {
      const chatInput = document.getElementById('chat-input-field');
      if (chatInput) { chatInput.value = val; }
      if (input) input.value = '';
      handleGlobalInput(input);
      sendChatMessage();
    }
  }

  function handleGlobalFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    if (!chatOpen) openChat();
    setTimeout(() => {
      const messages = document.getElementById('chat-messages');
      const userMsg = document.createElement('div');
      userMsg.className = 'chat-msg user';
      userMsg.innerHTML = `<div class="chat-bubble" style="display:flex;align-items:center;gap:8px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>${escapeHtml(file.name)}</div><div class="chat-time">Now</div>`;
      messages.appendChild(userMsg);
      scrollUserMsgToTop(userMsg);
      requestAnimationFrame(() => {
        const typing = document.createElement('div');
        typing.className = 'chat-msg acai'; typing.dataset.type = 'kai'; typing.id = 'typing-indicator';
        typing.innerHTML = '<div class="chat-sender">Kai</div><div class="chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;
        setTimeout(() => {
          document.getElementById('typing-indicator')?.remove();
          addChatMsg('acai', `Got it — I've received <strong>${escapeHtml(file.name)}</strong>. What would you like me to do with it?`);
          scrollChatToBottom();
        }, 900);
      });
    }, chatOpen ? 0 : 500);
    input.value = '';
    input.style.height = 'auto';
  }


  // ── ELEVENLABS VOICE — see /js/elevenlabs.js ──────────
  // kaiSpeak(), handleVoiceToggle(), kaiVoiceEnabled, currentAudio live there.


  // ── HOLD-TO-TALK ─────────────────────────────────────────

  let recognition   = null;
  let micListening  = false;
  let micHoldActive = false;
  let micHoldTimer  = null;

  function startHoldMic(e) {
    if (e) e.preventDefault();
    if (micHoldActive) return;
    micHoldActive = true;
    micHoldTimer = setTimeout(() => { startMicListening(); }, 120);
  }

  function releaseHoldMic(e) {
    if (e) e.preventDefault();
    clearTimeout(micHoldTimer);
    micHoldActive = false;
    if (micListening) stopMic();
  }

  function startMicListening() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      if (!chatOpen) openChat();
      addChatMsg('acai', "Voice isn't available in this browser. For the full experience, open this in Chrome on Android.");
      scrollChatToBottom();
      return;
    }
    if (micListening) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    recognition.onstart = () => {
      micListening = true;
      const btn = document.getElementById('mic-btn');
      const def = document.getElementById('mic-icon-default');
      const active = document.getElementById('mic-icon-active');
      const input = document.getElementById('acai-input');
      if (btn) { btn.classList.add('listening'); btn.classList.add('active'); }
      document.getElementById('ib-waveform')?.classList.add('active');
      if (input) input.placeholder = 'Listening...';
    };
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      const input = document.getElementById('acai-input');
      if (input) { input.value = transcript; handleGlobalInput(input); }
    };
    recognition.onend = () => {
      stopMic();
      const input = document.getElementById('acai-input');
      if (input && input.value.trim().length > 0) setTimeout(handleGlobalSend, 200);
    };
    recognition.onerror = (e) => {
      stopMic();
      if (e.error === 'not-allowed') {
        if (!chatOpen) openChat();
        addChatMsg('acai', "I can't hear you yet. To use voice, enable microphone access in your browser settings — then come back and hold the mic button.");
        scrollChatToBottom();
      }
    };
    if (!chatOpen) openChat();
    recognition.start();
  }

  function toggleMic() { if (micListening) { stopMic(); return; } startMicListening(); }
  function startVoiceChat() { toggleMic(); }

  function stopMic() {
    micListening = false;
    if (recognition) { try { recognition.stop(); } catch(e) {} recognition = null; }
    const btn = document.getElementById('mic-btn');
    const def = document.getElementById('mic-icon-default');
    const active = document.getElementById('mic-icon-active');
    const input = document.getElementById('acai-input');
    if (btn) { btn.classList.remove('listening'); btn.classList.remove('active'); }
    document.getElementById('ib-waveform')?.classList.remove('active');
    if (input && input.value === '') input.placeholder = 'Ask Kai';
  }

  // ── SWIPE GESTURES ──────────────────────────────────────

  let touchStartY = 0;
  let touchStartX = 0;
  let touchStartTarget = null;

  document.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    touchStartTarget = e.target;
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    // Don't fire global swipe if drawer is open
    if (document.getElementById('side-drawer')?.classList.contains('open')) return;
    // Don't fire global swipe if notif panel is open
    if (document.getElementById('notif-panel')?.classList.contains('open')) return;
    // Don't fire global swipe if touch started on a carousel
    if (touchStartTarget && touchStartTarget.closest('.approval-carousel, .snapshot-carousel')) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - touchStartX;
    const dy = Math.abs(endY - touchStartY);

    // Must be more horizontal than vertical
    const isHorizontal = Math.abs(dx) > 50 && Math.abs(dx) > dy;
    if (!isHorizontal) return;

    const isSwipeLeft  = dx < 0;
    const isSwipeRight = dx > 0;

    // Edge swipe right from left edge → open drawer
    if (isSwipeRight && touchStartX <= 28) {
      openDrawer();
      return;
    }

    // Swipe LEFT → close topmost overlay → chat
    if (isSwipeLeft && openOverlays.length > 0) {
      closeOverlay(openOverlays[openOverlays.length - 1]);
      return;
    }

    // Swipe LEFT → close chat → home
    if (isSwipeLeft && chatOpen && openOverlays.length === 0) {
      closeChat();
      return;
    }
  }, { passive: true });

  // ── DRAWER / NOTIF ──────────────────────────────────────

  function openDrawer() {
    const drawer = document.getElementById('side-drawer');
    const overlay = document.getElementById('drawer-overlay');
    drawer?.classList.add('open');
    overlay?.classList.add('open');
  }

  function closeDrawer() {
    document.getElementById('side-drawer')?.classList.remove('open');
    document.getElementById('drawer-overlay')?.classList.remove('open');
    closeDrawerSettings();
  }

  function openDrawerSettings() {
    const dst = document.getElementById('drawer-stt-list');
    if (dst) {
      const items = [
        { icon: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>', label: 'Profile', action: "closeDrawer(); openChat(); sendChip('Show me my profile');" },
        { icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>', label: 'Agents', action: "closeDrawer(); openChat(); sendChip('Show me agent controls');" },
        { icon: '<rect x="2" y="3" width="6" height="6" rx="1"/><rect x="16" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M5 9v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><line x1="12" y1="12" x2="12" y2="15"/>', label: 'Connectors', action: "closeDrawer(); openChat(); sendChip('Show me my connectors');" },
        { icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>', label: 'Usage', action: "closeDrawer(); openChat(); sendChip('Show me my usage');" },
        { icon: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>', label: 'Billing', action: "closeDrawer(); openChat(); sendChip('Show me my billing');" },
        { icon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>', label: 'Preferences', action: "closeDrawer(); openChat(); sendChip('Show me my preferences');" },
        { icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>', label: 'About', action: "closeDrawer();openEduChat('about')" },
        { icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>', label: 'Legal', action: "closeDrawer(); openChat(); sendChip('Show me legal');" },
        { icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>', label: 'Help', action: "closeDrawer();sendChatWithIntent('I need help')" },
        { icon: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>', label: 'Sign Out', danger: true, action: "" },
      ];

      dst.innerHTML = items.map(item => {
        const color = item.danger ? '#FF453A' : 'rgba(255,255,255,0.8)';
        const labelColor = item.danger ? 'color:#FF453A;' : '';
        return `<div class="drawer-item" onclick="${item.action}">
          <div class="drawer-item-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg></div>
          <div class="drawer-item-label" style="${labelColor}">${item.label}</div>
        </div>`;
      }).join('');
    }
    document.getElementById('drawer-settings-panel')?.classList.add('open');
  }

  function closeDrawerSettings() {
    document.getElementById('drawer-settings-panel')?.classList.remove('open');
  }

  function toggleNotif() {
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
    openOverlays.length = 0;
    if (!chatOpen) openChat();
    setTimeout(() => sendChip('Show me my notifications'), chatOpen ? 0 : 450);
  }

  function addNotificationsToChat(kaiMsg) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    const notifications = [
      { title: 'Inbound Agent — Call answered', body: 'Inbound Agent answered a call from Marcus Williams. Qualified the lead, answered 3 questions, and booked a callback for 2PM.', time: '9:04 AM · DKR Consulting', isNew: true, hasCall: true, callName: 'Marcus Williams' },
      { title: 'Speed to Lead — Outbound call made', body: 'Speed to Lead Agent called Sandra Lee 42 seconds after her form submission. Left a voicemail and sent a follow-up text.', time: '8:51 AM · DKR Consulting', isNew: true, hasCall: true, callName: 'Sandra Lee' },
      { title: 'Stripe Revenue Agent', body: 'Payment received — $1,500 from DKR client. Total today: $3,200 across all companies.', time: '7:58 AM · All Companies', isNew: true, hasCall: false },
      { title: 'Operations Supervisor — Flagged', body: 'Collections Agent drafted a payment guarantee to Riverside Medical. Message held — awaiting your approval before send.', time: '8:42 AM · DKR Consulting', isNew: true, hasCall: false },
      { title: 'Outbound Agent — Texts sent', body: 'Follow-up texts sent to 3 contacts in the queue. All messages delivered and logged.', time: '8:10 AM · DKR Consulting', isNew: true, hasCall: false },
    ];

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai'; wrapper.dataset.type = 'notifications';

    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:16px;width:100%;margin-top:4px;';

    // Group notifications by category
    const groups = [
      { key: 'calls',     label: 'CALLS',     color: 'rgba(255,255,255,0.35)', items: notifications.filter(n => n.hasCall) },
      { key: 'financial', label: 'FINANCIAL',  color: 'rgba(255,255,255,0.35)', items: notifications.filter(n => !n.hasCall && (n.title.toLowerCase().includes('invoice') || n.title.toLowerCase().includes('stripe') || n.title.toLowerCase().includes('billing') || n.title.toLowerCase().includes('xero'))) },
      { key: 'flagged',   label: 'FLAGGED',    color: 'rgba(255,255,255,0.35)', items: notifications.filter(n => !n.hasCall && (n.title.toLowerCase().includes('flagged') || n.title.toLowerCase().includes('supervisor'))) },
      { key: 'other',     label: 'OTHER',      color: 'rgba(255,255,255,0.35)', items: notifications.filter(n => !n.hasCall && !n.title.toLowerCase().includes('invoice') && !n.title.toLowerCase().includes('stripe') && !n.title.toLowerCase().includes('billing') && !n.title.toLowerCase().includes('xero') && !n.title.toLowerCase().includes('flagged') && !n.title.toLowerCase().includes('supervisor')) },
    ].filter(g => g.items.length > 0);

    // Summary stat boxes — tap scrolls to first card in group
    const statsBar = document.createElement('div');
    statsBar.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:4px;opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';
    statsBar.innerHTML = groups.map(g => `
      <div onclick="document.getElementById('notif-group-${g.key}')?.scrollIntoView({behavior:'smooth',block:'start'})" style="background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.06);border-radius:24px;padding:18px 8px;text-align:center;cursor:pointer;transition:background 0.15s;" onmousedown="this.style.background='rgba(255,255,255,0.09)'" onmouseup="this.style.background='rgba(255,255,255,0.045)'">
        <div style="font-size:10px;font-weight:760;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,0.34);margin-bottom:12px;">${g.label}</div>
        <div style="font-size:28px;font-weight:760;letter-spacing:-.05em;color:var(--text-primary);line-height:1;">${g.items.length}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.32);margin-top:8px;">Today</div>
      </div>`).join('');
    cardsWrap.appendChild(statsBar);

    const allItems = [statsBar];

    // Render each group with a label and cards
    groups.forEach(g => {
      // Group label
      const groupLabel = document.createElement('div');
      groupLabel.id = `notif-group-${g.key}`;
      groupLabel.style.cssText = 'font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:' + g.color + ';padding:4px 0 0;opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';
      groupLabel.textContent = g.label;
      cardsWrap.appendChild(groupLabel);
      allItems.push(groupLabel);

      g.items.forEach(n => {
        const card = document.createElement('div');
        card.className = 'agent-card';
        card.style.cssText = 'opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';
        card.onclick = function() { toggleAgentCard(this); };

        const statusDot = n.isNew
          ? `<div class="agent-status active"><div class="agent-status-dot"></div>New</div>`
          : `<div class="agent-status"><div class="agent-status-dot" style="background:rgba(255,255,255,0.2);"></div></div>`;

        const callBtns = n.hasCall ? `
          <div style="display:flex;gap:8px;padding-top:8px;flex-wrap:wrap;">
            <div onclick="event.stopPropagation();sendChatWithIntent('Show me the lead for ${n.callName}')" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View Lead</div>
            <div onclick="event.stopPropagation();addCallTranscriptToChat(null,'${n.callName}')" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">Transcript</div>
            <div onclick="event.stopPropagation();addCallTranscriptToChat(null,'${n.callName}')" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">▶ Listen</div>
          </div>` :
          n.title.toLowerCase().includes('flagged') || n.title.toLowerCase().includes('supervisor') ? `
          <div style="display:flex;gap:8px;padding-top:8px;flex-wrap:wrap;">
            <div onclick="event.stopPropagation();sendChatWithIntent('Show me the flagged message')" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View Message</div>
            <div onclick="event.stopPropagation();" style="padding:5px 12px;background:rgba(52,199,89,0.15);border:1px solid rgba(52,199,89,0.3);border-radius:8px;font-size:13px;font-weight:600;color:#34C759;cursor:pointer;">Approve</div>
            <div onclick="event.stopPropagation();" style="padding:5px 12px;background:rgba(255,69,58,0.12);border:1px solid rgba(255,69,58,0.25);border-radius:8px;font-size:13px;font-weight:600;color:#FF453A;cursor:pointer;">Reject</div>
          </div>` :
          n.title.toLowerCase().includes('invoice') || n.title.toLowerCase().includes('billing') ? `
          <div style="display:flex;gap:8px;padding-top:8px;flex-wrap:wrap;">
            <div onclick="event.stopPropagation();sendChatWithIntent('Show me the invoice details')" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View Invoice</div>
            <div onclick="event.stopPropagation();sendChatWithIntent('Show me the invoice details')" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View in Stripe</div>
          </div>` :
          n.title.toLowerCase().includes('stripe') || n.title.toLowerCase().includes('revenue') || n.title.toLowerCase().includes('payment') ? `
          <div style="display:flex;gap:8px;padding-top:8px;flex-wrap:wrap;">
            <div onclick="event.stopPropagation();sendChatWithIntent('Show me my revenue details')" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View Revenue</div>
            <div onclick="event.stopPropagation();sendChatWithIntent('Show me the payment receipt')" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View in Stripe</div>
          </div>` :
          n.title.toLowerCase().includes('xero') || n.title.toLowerCase().includes('bookkeeping') ? `
          <div style="display:flex;gap:8px;padding-top:8px;flex-wrap:wrap;">
            <div onclick="event.stopPropagation();sendChatWithIntent('Show me my bookkeeping summary')" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View Summary</div>
            <div onclick="event.stopPropagation();sendChatWithIntent('Show me my bookkeeping summary')" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View in Xero</div>
          </div>` : `
          <div style="display:flex;gap:8px;padding-top:8px;flex-wrap:wrap;">
            <div onclick="event.stopPropagation();sendChatWithIntent('Show me my leads')" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View Lead</div>
          </div>`;

        const cardIndex = allItems.length - 1;
        const numLabel = String(cardIndex).padStart(2,'0');
        card.style.cssText = 'display:grid;grid-template-columns:44px 1fr;gap:14px;align-items:flex-start;padding:16px;border-radius:22px;background:rgba(255,255,255,0.042);border:1px solid rgba(255,255,255,0.055);cursor:pointer;opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';
        card.innerHTML = `
          <div style="width:44px;height:44px;border-radius:16px;display:grid;place-items:center;background:rgba(255,255,255,0.065);border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.52);font-weight:800;font-size:16px;flex-shrink:0;">${numLabel}</div>
          <div style="min-width:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:0;">
              <div style="font-size:17px;font-weight:760;letter-spacing:-0.025em;color:var(--text-primary);flex:1;">${n.title}</div>
              ${statusDot}
              <svg style="width:16px;height:16px;stroke:rgba(255,255,255,0.3);fill:none;stroke-width:2;stroke-linecap:round;flex-shrink:0;transition:transform 0.25s ease;" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div style="margin-top:5px;color:rgba(255,255,255,0.48);font-size:14px;line-height:1.38;">${n.body}</div>
            <div style="margin-top:8px;color:rgba(255,255,255,0.24);font-size:12px;">${n.time}</div>
            <div class="agent-card-body">
              <div style="margin-bottom:8px;font-size:12px;color:rgba(255,255,255,0.24);">${n.time}</div>
              ${callBtns}
            </div>
          </div>`;

        cardsWrap.appendChild(card);
        allItems.push(card);
      });
    });

    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.setAttribute('data-kicker', 'Agent Activity');
    sectionBar.setAttribute('data-desc', `Calls, follow-ups, invoices, and flagged messages — all reviewed and ready for you.`);
    sectionBar.innerHTML = '<span class="chat-section-bar-title">Notifications</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);

    const time = document.createElement('div');
    time.className = 'chat-time';
    time.textContent = 'Now';

    wrapper.appendChild(sectionBar);
    wrapper.appendChild(sectionBody);
    wrapper.appendChild(time);
    messages.appendChild(wrapper);

    // Exact scroll from addAgentCardsToChat
    requestAnimationFrame(() => {
      if (kaiMsg) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = kaiMsg.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
      }
    });

    // Stagger fade-in
    allItems.forEach((el, i) => {
      setTimeout(() => {
        el.style.opacity = '';
        el.style.transform = '';
      }, 120 + i * 60);
    });
  }

  // ── COMPANY DETAIL ──────────────────────────────────────

  function openCompanyDetail(id) {
    renderCompanyScreen(id);
    openOverlay('overlay-company-detail');
  }

  // ── LEAD CARD EXPAND ────────────────────────────────────

  function toggleLeadCard(index) {
    const body = document.getElementById('lcb-' + index);
    const preview = document.getElementById('lcp-' + index);
    const hint = document.getElementById('lch-' + index);
    if (!body) return;
    const collapsed = body.classList.contains('collapsed');
    body.classList.toggle('collapsed');
    if (preview) {
      preview.style.webkitLineClamp = collapsed ? 'unset' : '2';
      preview.style.display = collapsed ? 'block' : '-webkit-box';
    }
    if (hint) hint.textContent = collapsed ? 'Collapse ↑' : 'Expand ↓';
  }

  // ── LEADS FILTER ────────────────────────────────────────

  const agentsStatusText = {
    dkr: 'DKR Consulting is running itself. Kai is handling calls, texts, and emails 24/7 — no staff needed.',
    tvhealthcare: 'TV Healthcare is running itself. Kai answers every call, sends every follow-up, and never takes a day off.',
    realty: 'Twizted Vybz Realty is running itself. Kai handles every inquiry via call, text, and email automatically.',
    capital: 'Generations Capital is running itself. Kai qualifies leads, nurtures prospects, and follows up — hands-free.',
    gft: 'Guilt Free Temptations is running itself. Kai handles customer questions, orders, and follow-ups automatically.',
    streetwear: 'Twizted Vybz Streetwear is running itself. Kai handles inbound and outbound — no manual work needed.'
  };

  function setAgentsCompany(company, tabEl) {
    document.querySelectorAll('#agents-company-filters .leads-filter-tab').forEach(t => t.classList.remove('active'));
    if (tabEl) tabEl.classList.add('active');
    ['dkr','tvhealthcare','realty','capital','gft','streetwear'].forEach(c => {
      const el = document.getElementById('agents-section-' + c);
      if (el) el.style.display = c === company ? '' : 'none';
    });
    const statusEl = document.getElementById('agents-status-text');
    if (statusEl && agentsStatusText[company]) statusEl.textContent = agentsStatusText[company];
  }

  function setLeadsFilter(filter, tabEl) {
    document.querySelectorAll('#leads-filters-ov .leads-filter-tab').forEach(t => t.classList.remove('active'));
    if (tabEl) tabEl.classList.add('active');
    document.querySelectorAll('#leads-list .lead-card').forEach(card => {
      const f = card.dataset.filter;
      card.style.display = (filter === 'all' || f === filter) ? '' : 'none';
    });
  }

  // ── TASKS ───────────────────────────────────────────────

  function setTasksFilter(filter, tabEl) {
    document.querySelectorAll('#tasks-filters .leads-filter-tab').forEach(t => t.classList.remove('active'));
    if (tabEl) tabEl.classList.add('active');
    document.querySelectorAll('#overlay-tasks .task-row').forEach(row => {
      const f = row.dataset.filter;
      row.style.display = (filter === 'all' || f === filter) ? '' : 'none';
    });
  }

  function toggleTask(e, taskId) {
    e.stopPropagation();
    const check = document.getElementById('check-' + taskId);
    const title = document.getElementById('title-' + taskId);
    if (!check || !title) return;
    const isDone = check.classList.contains('done');
    check.classList.toggle('done', !isDone);
    title.classList.toggle('done-text', !isDone);
    if (!isDone) {
      check.style.transform = 'scale(1.15)';
      setTimeout(() => { check.style.transform = ''; }, 200);
    }
  }

  // ── APPROVALS ───────────────────────────────────────────

  const homeApprovalState = { current: 0 };
  const companyApprovalState = { current: 0 };
  const totalApprovals = 5;
  const approvalMessages = [
    'Follow-up to Marcus Williams scheduled for 2:00 PM.',
    'Review request to Sandra Lee scheduled for after consultation.',
    'Proposal sent to Riverside Medical Group.'
  ];
  const dismissContexts = [
    'Edit the follow-up to Marcus Williams — ',
    'Edit the review request to Sandra Lee — ',
    'Edit the Riverside Medical proposal — '
  ];
  let approvalStartX = 0;

  function goToApproval(index, scope) {
    const state = scope === 'company' ? companyApprovalState : homeApprovalState;
    const suffix = scope === 'company' ? '-co' : '';
    const max = scope === 'company' ? 99 : totalApprovals - 1;
    state.current = Math.max(0, Math.min(index, max));
    const track = document.getElementById('approval-track' + suffix);
    if (track) track.style.transform = `translateX(-${state.current * 100}%)`;
    document.querySelectorAll(`#approval-dots${suffix} .snapshot-dot`).forEach((dot, i) => {
      dot.classList.toggle('active', i === state.current);
    });
    const counter = document.getElementById('approval-counter' + suffix);
    if (counter) counter.textContent = `${state.current + 1} of ${totalApprovals}`;
  }

  function togglePreview(index) {
    const preview = document.getElementById('preview-' + index);
    const hint = document.getElementById('hint-' + index);
    if (!preview) return;
    preview.classList.toggle('expanded');
    if (hint) hint.textContent = preview.classList.contains('expanded') ? 'Collapse ↑' : 'Tap to read full message ↓';
  }

  function handleApproval(index, action, scope) {
    const selector = scope === 'company' ? '#overlay-company-detail .approval-slide' : '#overlay-approvals .approval-slide';
    const slides = document.querySelectorAll(selector);
    const slide = slides[index];
    if (!slide) return;
    const card = slide.querySelector('.approval-card');
    if (!card) return;

    if (action === 'approve') {
      card.innerHTML = `<div class="approval-card-header"><div class="approval-acai-dot" style="background:rgba(255,255,255,0.4);animation:none;"></div><div class="approval-label">Done</div></div><div class="approval-message" style="color:var(--text-secondary);font-size:15px;">${approvalMessages[index] || 'Done.'}</div>`;
      setTimeout(() => {
        const st = scope === 'company' ? companyApprovalState : homeApprovalState;
        goToApproval(st.current + 1, scope);
      }, 800);
    } else {
      card.innerHTML = `<div class="approval-card-header"><div class="approval-acai-dot"></div><div class="approval-label">What should Kai change?</div></div><div style="display:flex;gap:8px;align-items:center;"><input type="text" id="dismiss-input-${index}" placeholder="Make it shorter, change the tone..." style="flex:1;background:rgba(255,255,255,0.08);border:none;border-radius:10px;padding:11px 14px;font-family:var(--font);font-size:14px;color:var(--text-primary);outline:none;" onkeydown="if(event.key==='Enter'){openChatWithDismiss(${index});}"/><button onclick="openChatWithDismiss(${index})" style="background:rgba(255,255,255,0.08);border:none;border-radius:10px;padding:11px 16px;font-family:var(--font);font-size:13px;font-weight:600;color:rgba(255,255,255,0.9);cursor:pointer;white-space:nowrap;">Tell Acai</button></div><button onclick="handleDismissSkip(${index},'${scope || ''}')" style="background:none;border:none;font-family:var(--font);font-size:13px;color:var(--text-tertiary);cursor:pointer;padding:4px 0;text-align:left;">Just dismiss</button>`;
      setTimeout(() => { document.getElementById('dismiss-input-' + index)?.focus(); }, 50);
    }
  }

  function openChatWithDismiss(index) {
    const inp = document.getElementById('dismiss-input-' + index);
    const text = inp ? inp.value.trim() : '';
    const context = dismissContexts[index] || '';
    closeOverlay('overlay-approvals');
    sendChatWithIntent(text ? context + text : context);
  }

  function handleDismissSkip(index, scope) {
    const slides = document.querySelectorAll('#overlay-approvals .approval-slide');
    const slide = slides[index];
    if (!slide) return;
    const card = slide.querySelector('.approval-card');
    if (card) { card.style.opacity = '0'; card.style.transform = 'scale(0.96)'; card.style.transition = 'all 0.25s ease'; }
    const st = scope === 'company' ? companyApprovalState : homeApprovalState;
    setTimeout(() => goToApproval(st.current + 1 < totalApprovals ? st.current + 1 : st.current, scope), 300);
  }

  // ── CHAT ENGINE ─────────────────────────────────────────

  const acaiResponses = [
    "Got it. I'll take care of that right away.",
    "On it. I'll log that in HubSpot and set a follow-up reminder for tomorrow.",
    "Marcus Williams — I'll send him a follow-up message now. Want me to schedule a call too?",
    "I've updated the record. Anything else you need for DKR today?",
    "Done. I've added that to your tasks and flagged it as high priority.",
    "Revenue is tracking at $4,200 for the month — up 12% from last month. You're on pace to hit your target.",
    "I can handle that. Give me a moment.",
    "Noted. I'll make sure the calendar is updated and send a confirmation to the client."
  ];
  let responseIndex = 0;

  function escapeHtml(v) {
    return String(v).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  const intentMap = [
    ['calls',      ['call', 'calls', 'phone', 'inbound', 'outbound', 'voicemail', 'transcript']],
    ['financials', ['financial', 'financials', 'finance', 'money', 'invoice', 'invoices', 'revenue', 'stripe', 'xero', 'bookkeeping', 'payment', 'payments']],
    ['leads', ['lead', 'leads', 'prospect', 'prospects']],
    ['tasks', ['task', 'tasks', 'to do', 'todo']],
    ['agents', ['agent', 'agents', 'ai agent']],
    ['approvals', ['approval', 'approvals', 'approve']],
    ['reports', ['report', 'reports', 'metric', 'metrics', 'performance', 'health', 'numbers', 'business health', 'business']],
    ['companies', ['company', 'companies', 'brand', 'brands', 'my companies']],
    ['calendar', ['calendar', 'schedule', 'meeting', 'meetings', 'appointment']],
    ['settings', ['setting', 'settings', 'account']],
    ['settings-profile', ['open settings profile', 'settings profile']],
    ['settings-agents', ['open settings agents', 'settings agents', 'open agent controls']],
    ['settings-connectors', ['open settings connectors', 'settings connectors']],
    ['settings-usage', ['open settings usage', 'settings usage']],
    ['settings-billing', ['open settings billing', 'settings billing']],
    ['settings-preferences', ['open settings preferences', 'settings preferences']],
    ['settings-legal', ['open settings legal', 'settings legal']],
    ['models', ['model', 'models', 'haiku', 'sonnet', 'opus', 'token', 'tokens', 'ai model', 'about the ai models', 'tell me about the ai models']],
  ];

  const intentReplies = {
    leads: 'Your pipeline is live. Every lead your agents captured is right here.',
    tasks: 'Your task board is ready. Kai has been keeping everything organized.',
    agents: 'Your agents are already working. Here\'s the full picture.',
    approvals: 'These are waiting on you. Review and approve when ready.',
    reports: 'Here is your business health. Kai has pulled the latest numbers.',
    companies: 'Here are your companies. Tap any one to go deeper.',
    calendar: 'Here is your schedule. Kai has everything lined up.',
    settings: 'Here are your settings. Make any changes you need.',
    models: `Each model has different speed, power, and token costs. Haiku is fastest and lightest. Sonnet is the recommended default for most tasks. Opus is the most powerful but uses roughly 15× more tokens per message — best saved for deep research or complex strategy. What would you like to know?`,
  };

  function detectIntent(text) {
    const t = text.toLowerCase().trim();
    for (const [type, words] of intentMap) {
      if (words.some(w => t === w || t.includes(w))) return type;
    }
    return null;
  }

  function addChatMsg(role, content, actionLabel, overlayIdOverride, options) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;
    const div = document.createElement('div');
    div.className = 'chat-msg ' + role; if (role === 'user') div.dataset.type = 'user'; else div.dataset.type = 'kai';
    if (role === 'acai') {
      div.innerHTML = `<div class="chat-sender">Kai</div><div class="chat-bubble"></div><div class="chat-time">Now</div>`;
      kaiSpeak(content);
      const bubble = div.querySelector('.chat-bubble');
      let idx = 0;
      function typeNext() {
        if (idx <= content.length) {
          bubble.innerHTML = content.slice(0, idx);
          idx++;
          setTimeout(typeNext, 8);
        }
      }
      typeNext();
      if (actionLabel) {
        const overlayId = overlayIdOverride || ('overlay-' + actionLabel.toLowerCase().replace(/ /g, ''));
        const actionEl = document.createElement('div');
        actionEl.className = 'chat-action';
        actionEl.innerHTML = `<span class="chat-action-label">Back to ${actionLabel} ›</span><svg class="chat-action-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>`;
        actionEl.onclick = () => openOverlay(overlayId);
        div.appendChild(actionEl);
      }
      if (options && options.length) {
        const optWrap = document.createElement('div');
        optWrap.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:8px;width:100%;';
        options.forEach(opt => {
          const btn = document.createElement('button');
          btn.style.cssText = 'width:100%;padding:12px 16px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:12px;font-family:var(--font);font-size:14px;font-weight:500;color:var(--text-primary);cursor:pointer;text-align:left;letter-spacing:-0.01em;';
          btn.textContent = opt.label;
          btn.onclick = () => sendChatWithIntent(opt.intent);
          optWrap.appendChild(btn);
        });
        div.appendChild(optWrap);
      }
    } else {
      div.innerHTML = `<div class="chat-bubble">${content}</div><div class="chat-time">Now</div>`;
    }
    messages.appendChild(div);
    if (role === 'user') {
      scrollUserMsgToTop(div);
    } else if (role !== 'acai') {
      messages.scrollTop = messages.scrollHeight;
    }
    return div;
  }

  // ── AGENT CARDS IN CHAT ─────────────────────────────────────────────────

  const agentCompanyMap = {
    'dkr': 'dkr', 'consulting': 'dkr', 'healthcare': 'dkr',
    'realty': 'realty', 'real estate': 'realty',
    'capital': 'capital', 'generations': 'capital',
    'gft': 'gft', 'guilt': 'gft', 'temptations': 'gft',
    'streetwear': 'streetwear', 'tv health': 'tvhealthcare', 'tv healthcare': 'tvhealthcare'
  };

  function detectAgentCommand(text) {
    const t = text.toLowerCase();
    if (t.includes('show me all') || t.includes('all agents') || t.includes('all my agents') || t.includes('show agents')) return 'all';
    for (const [keyword, company] of Object.entries(agentCompanyMap)) {
      if (t.includes(keyword)) return company;
    }
    const nonAgentKw = ['lead','leads','prospect','approval','approvals','task','tasks','calendar','report','company','companies','health','business'];
    const isNonAgent = nonAgentKw.some(w => t.includes(w));
    if ((t.includes('agent') || t.includes('show me')) && !isNonAgent) return 'all';
    return null;
  }

  function getAgentCardsByCompany(companyKey) {
    // Pull live card HTML from the agents overlay
    const allCards = document.querySelectorAll('#overlay-agents .agent-card');
    if (!allCards.length) return [];
    if (companyKey === 'all') return Array.from(allCards);

    // Find the section label that matches, then collect its cards
    const sections = document.querySelectorAll('#overlay-agents [data-company]');
    // Fallback: filter by company label in section header
    const agentSections = document.querySelectorAll('#overlay-agents .agent-cards');
    let found = [];
    agentSections.forEach(section => {
      const header = section.previousElementSibling;
      if (header && header.textContent.toLowerCase().includes(companyKey.replace('tvhealthcare','tv health').replace('gft','guilt'))) {
        found = Array.from(section.querySelectorAll('.agent-card'));
      }
    });
    return found.length ? found : Array.from(allCards);
  }

  function addAgentCardsToChat(companyKey, kaiMsg) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai'; wrapper.dataset.type = 'agents';

    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:16px;width:100%;margin-top:4px;';

    let sections = [];
    if (companyKey === 'all') {
      ['supervisor','dkr','tvhealthcare','realty','capital','gft','streetwear'].forEach(id => {
        const s = document.getElementById('agents-section-' + id);
        if (s) sections.push(s);
      });
    } else {
      const s = document.getElementById('agents-section-' + companyKey);
      if (s) sections.push(s);
    }

    // Deep-clone each section, hide all cards initially, collect them for stagger
    const allItems = []; // { el, type: 'label'|'card' }
    sections.forEach(section => {
      const clone = section.cloneNode(true);
      clone.style.display = '';
      clone.removeAttribute('id'); // avoid duplicate IDs

      // Remove "Available to Activate" label and the cards after it
      const labels = Array.from(clone.querySelectorAll('.section-label'));
      labels.forEach(lbl => {
        if (lbl.textContent.toLowerCase().includes('available')) {
          // Remove this label and its sibling card container
          const nextSibling = lbl.closest('div') !== clone ? lbl.parentElement : null;
          if (nextSibling && nextSibling !== clone) nextSibling.remove();
          else lbl.remove();
        }
      });
      // Also remove any remaining inactive/sleeping cards
      clone.querySelectorAll('.agent-card[style*="opacity:0.65"]').forEach(c => c.remove());

      // Re-wire onclick on each card clone
      clone.querySelectorAll('.agent-card').forEach(card => {
        card.classList.remove('open');
        card.onclick = function() { toggleAgentCard(this); };
      });

      // Hide section labels
      clone.querySelectorAll('.section-label').forEach(lbl => {
        lbl.style.opacity = '0';
        lbl.style.transition = 'opacity 0.22s ease';
        allItems.push({ el: lbl, type: 'label' });
      });

      // Hide all cards
      clone.querySelectorAll('.agent-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        card.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
        allItems.push({ el: card, type: 'card' });
      });

      cardsWrap.appendChild(clone);
    });

    const time = document.createElement('div');
    time.className = 'chat-time';
    time.textContent = 'Now';

    // "More Agents" card at the bottom
    const moreCard = document.createElement('div');
    moreCard.className = 'agent-card';
    moreCard.style.cssText = 'opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;cursor:pointer;';
    moreCard.onclick = () => { closeChat && closeChat(); openOverlay('overlay-agents'); };
    moreCard.innerHTML = `
      <div class="agent-card-top">
        <div class="agent-card-name" style="display:flex;align-items:center;gap:8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          More Agents Available
        </div>
        <svg class="agent-card-chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <div class="agent-card-preview">Tap to view and activate agents across all companies</div>`;
    cardsWrap.appendChild(moreCard);

    // Collapse bar
    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.setAttribute('data-kicker', 'AI Agents');
    sectionBar.setAttribute('data-desc', `A clear view of what each agent does, what it handled, and what needs your approval.`);
    sectionBar.innerHTML = '<span class="chat-section-bar-title">AI Agents</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

    // Wrap cardsWrap in collapsible body
    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);

    wrapper.appendChild(sectionBar);
    wrapper.appendChild(sectionBody);
    wrapper.appendChild(time);
    messages.appendChild(wrapper);

    // Snap scroll to wrapper — all cards invisible, no train
    requestAnimationFrame(() => {
      if (kaiMsg) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = kaiMsg.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
      }
    });

    // Stagger fade-in
    allItems.forEach((item, i) => {
      setTimeout(() => {
        item.el.style.opacity = '';
        if (item.type === 'card') item.el.style.transform = '';
      }, 120 + i * 80);
    });
    // More card fades in last
    setTimeout(() => {
      moreCard.style.opacity = '';
      moreCard.style.transform = '';
    }, 120 + allItems.length * 80);
  }

  // ── SETTINGS LAUNCH — no user message, mirrors agents timing exactly ────
  function launchSettingsChat(key) {
    const intros = {
      profile:     "Here\'s your profile. Update your name and how Kai should address you.",
      agents:      'Agent controls — manage approvals and notifications for every agent.',
      connectors:  'Connect your tools so Kai has live data instead of demo data.',
      usage:       "Here\'s your current usage across this month and session.",
      billing:     'Your plan and billing details. All plans are month-to-month.',
      preferences: 'Preferences — theme, display options, and how I behave.',
      legal:       'Legal disclaimer and terms of use for AcaiOS.'
    };
    const intro = intros[key];
    const buildHTML = settingsCardHTML[key];
    if (!intro || !buildHTML) return;

    closeDrawer();
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
    if (typeof openOverlays !== 'undefined') openOverlays.length = 0;
    openChat();

    // Wait until after openChat's 450ms scroll reset, then run exactly like sendChatMessage
    setTimeout(() => {
      const messages = document.getElementById('chat-messages');
      if (!messages) return;

      const typing = document.createElement('div');
      typing.className = 'chat-msg acai'; typing.dataset.type = 'kai';
      typing.id = 'typing-indicator';
      typing.innerHTML = '<div class="chat-sender">Kai</div><div class="chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
      messages.appendChild(typing);
      messages.scrollTop = messages.scrollHeight;

      setTimeout(() => {
        document.getElementById('typing-indicator')?.remove();
        const kaiMsg = addChatMsg('acai', intro);
        addSettingsCardToChat(key, kaiMsg);
      }, 700);
    }, 480);
  }

  // ── SETTINGS CARDS IN CHAT ─────────────────────────────────────────────
  // Mirrors addAgentCardsToChat exactly — kaiMsg passed in, scroll to it via rAF

  function addSettingsCardToChat(key, kaiMsg) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    const titles = {
      profile:'Profile', agents:'Agent Controls', connectors:'Connectors',
      usage:'Usage', billing:'Billing', preferences:'Preferences', legal:'Legal'
    };
    const title = titles[key] || key;
    const buildHTML = settingsCardHTML[key];
    if (!buildHTML) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai'; wrapper.dataset.type = 'settings';

    const contentWrap = document.createElement('div');
    contentWrap.style.cssText = 'display:flex;flex-direction:column;gap:12px;width:100%;margin-top:4px;box-sizing:border-box;';
    contentWrap.innerHTML = buildHTML();

    // Hide all direct children for stagger animation
    const allItems = Array.from(contentWrap.children);
    allItems.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      el.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
    });

    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.innerHTML = '<span class="chat-section-bar-title">' + title + '</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(contentWrap);

    const time = document.createElement('div');
    time.className = 'chat-time';
    time.textContent = 'Now';

    wrapper.appendChild(sectionBar);
    wrapper.appendChild(sectionBody);
    wrapper.appendChild(time);
    messages.appendChild(wrapper);

    // Exact scroll from addAgentCardsToChat
    requestAnimationFrame(() => {
      if (kaiMsg) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = kaiMsg.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
      }
    });

    // Stagger fade-in — exact same timing as addAgentCardsToChat
    allItems.forEach((el, i) => {
      setTimeout(() => {
        el.style.opacity = '';
        el.style.transform = '';
      }, 120 + i * 80);
    });
  }

  // ── APPROVAL CARDS IN CHAT ──────────────────────────────────────────────────

  const approvalChatData = [
    {
      id: "acc-0",
      label: "New inquiry response",
      agent: "Speed to Lead",
      contact: "Marcus Williams",
      context: "Marcus submitted a form 42 seconds ago. Speed to Lead Agent drafted a callback script.",
      draft: "Hi Marcus, this is Kai calling on behalf of DKR Consulting. I saw you just reached out and wanted to connect right away. We help healthcare operations teams streamline workflows. Do you have two minutes to talk?",
      approveLabel: "Send Call",
      timestamp: "Just now"
    },
    {
      id: "acc-1",
      label: "Appointment reminder",
      agent: "Appt. Reminder",
      contact: "Sandra Lee",
      context: "Sandra has a consultation tomorrow at 2:00 PM. 24-hour reminder ready to send.",
      draft: "Hi Sandra, friendly reminder that your consultation with DKR Consulting is tomorrow, May 26th at 2:00 PM. Need to reschedule? Just reply and we will handle it. See you tomorrow!",
      approveLabel: "Send Reminder",
      timestamp: "8 min ago"
    },
    {
      id: "acc-2",
      label: "Review request",
      agent: "Review & Rep.",
      contact: "James Porter",
      context: "James consultation wrapped this morning. Kai wants to request a Google review.",
      draft: "Hi James, great connecting this morning. If you have 60 seconds, a quick Google review would mean a lot to our team. Sending you the direct link now. Thank you!",
      approveLabel: "Send Request",
      timestamp: "2 hr ago"
    },
    {
      id: "acc-3",
      label: "Reactivation outreach",
      agent: "Reactivation",
      contact: "David Okafor",
      context: "David has not engaged in 94 days. Lead Nurture Agent drafted a personal check-in.",
      draft: "Hi David, it has been a little while. Wanted to check in and see how things are going. We have added new services that might be relevant to what you are building. Would love to reconnect.",
      approveLabel: "Send Message",
      timestamp: "Yesterday"
    },
    {
      id: "acc-4",
      label: "Payment follow-up",
      agent: "Collections",
      contact: "Riverside Medical",
      context: "Invoice INV-2026-003 for $8,500 is 7 days overdue.",
      draft: "Hi, reaching out regarding invoice INV-2026-003 for $8,500 due May 18th. Wanted to check in and make sure everything is in order. Happy to help if you have any questions.",
      approveLabel: "Send Follow-up",
      timestamp: "Yesterday"
    }
  ]

  function buildApprovalChatCard(appr) {
    const div = document.createElement('div');
    div.className = 'chat-card';
    div.id = appr.id;

    div.innerHTML = `
      <div class="chat-card-top" onclick="toggleChatCard('${appr.id}')">
        <div class="chat-card-name">${appr.contact}</div>
        <svg class="chat-card-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="chat-card-body-text">${appr.label} · ${appr.agent} — ${appr.draft}</div>
      <div class="chat-card-hint">
        <span class="chat-card-hint-label">Expand</span>
        <span class="chat-card-hint-sub">${appr.timestamp}</span>
      </div>
      <div class="chat-card-detail">
        <div class="chat-card-kai">
          <div class="chat-card-kai-label"><div class="chat-card-kai-dot"></div>${appr.label} · ${appr.agent}</div>
          <div class="chat-card-kai-text">${appr.context}</div>
        </div>
        <div class="chat-card-draft">${appr.draft}</div>
        <div class="chat-card-actions">
          <button class="chat-card-btn primary" onclick="event.stopPropagation();approveFromChat('${appr.id}')">${appr.approveLabel}</button>
          <button class="chat-card-btn secondary" onclick="event.stopPropagation();editFromChat('${appr.id}')">Edit</button>
        </div>
      </div>`;

    return div;
  }

    // toggleApprovalChatCard -> unified toggleChatCard(id)

  function approveFromChat(id) {
    const card = document.getElementById(id);
    if (!card) return;
    const appr = approvalChatData.find(a => a.id === id);
    card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.96)';
    setTimeout(() => {
      card.innerHTML = `<div style="padding:18px 20px;display:flex;align-items:center;gap:10px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.8)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span style="font-size:13px;color:var(--text-secondary);">Sent — ${appr ? appr.approveLabel : 'Done'}</span>
      </div>`;
      card.style.opacity = '1';
      card.style.transform = '';
    }, 260);
  }

  function editFromChat(id) {
    const appr = approvalChatData.find(a => a.id === id);
    if (!appr) return;
    sendChatWithIntent('Edit the ' + appr.label + ' draft for ' + appr.contact);
  }

  function addApprovalCardsToChat(kaiMsg) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    const approvals = [
      {
        agent: 'Speed to Lead Agent',
        action: 'Callback · Marcus Williams',
        time: '9:04 AM',
        company: 'DKR Consulting',
        status: 'Drafted',
        preview: 'Marcus submitted a form 42 seconds ago. Speed to Lead Agent drafted a callback script.',
        message: '"Hi Marcus, this is Kai calling on behalf of DKR Consulting. I saw you reached out — I\'d love to connect you with Tony. Are you available for a quick call today?"',
        approveIntent: null,
      },
      {
        agent: 'Lead Nurture Agent',
        action: 'Follow-up · Sandra Lee',
        time: '9:45 AM',
        company: 'DKR Consulting',
        status: 'Drafted',
        preview: 'Sandra Lee hasn\'t responded in 3 days. Lead Nurture Agent drafted a re-engagement message.',
        message: '"Hi Sandra, just checking in — Tony wanted to make sure you had everything you needed. Let us know if you have any questions about our consulting services."',
        approveIntent: null,
      },
      {
        agent: 'Collections Agent',
        action: 'Invoice reminder draft',
        time: '10:03 AM',
        company: 'DKR Consulting',
        status: 'Drafted',
        preview: 'Invoice INV-2026-003 for Riverside Medical is 7 days overdue. Collections Agent drafted a follow-up.',
        message: '"Hi, this is a friendly reminder that Invoice INV-2026-003 for $8,500 is now 7 days past due. Please let us know if you have any questions."',
        approveIntent: null,
      },
      {
        agent: 'Lead Nurture Agent',
        action: 'Win-back draft · David Okafor',
        time: '11:20 AM',
        company: 'DKR Consulting',
        status: 'Drafted',
        preview: 'David Okafor hasn\'t engaged in 94 days. Lead Nurture Agent drafted a personal check-in.',
        message: '"Hey David, Tony wanted to personally reach out. It\'s been a while and we\'d love to reconnect. Is there anything we can help you with?"',
        approveIntent: null,
      },
      {
        agent: 'Operations Supervisor',
        action: 'Flagged Collections Agent message',
        time: '8:42 AM',
        company: 'DKR Consulting',
        status: 'Flagged',
        preview: 'Collections Agent drafted a payment guarantee to Riverside Medical. Supervisor flagged it — contains financial guarantee.',
        message: '"As discussed we guarantee full refund within 30 days if the retainer does not deliver results."',
        approveIntent: null,
      },
    ];

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai'; wrapper.dataset.type = 'approvals';

    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.setAttribute('data-kicker', 'Needs Your Attention');
    sectionBar.setAttribute('data-desc', `These items are ready to go — they're just waiting on you.`);
    sectionBar.innerHTML = '<span class="chat-section-bar-title">Approvals</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:16px;width:100%;margin-top:4px;';

    const allItems = [];

    approvals.forEach(a => {
      const card = document.createElement('div');
      card.className = 'agent-card';
      card.style.cssText = 'opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';
      card.onclick = function() { toggleAgentCard(this); };

      const statusColor = a.status === 'Flagged' ? '#FF453A' : 'rgba(255,255,255,0.35)';

      card.innerHTML = `
        <div class="agent-card-top">
          <div class="agent-card-name">${a.action}</div>
          <div class="agent-status active"><div class="agent-status-dot"></div></div>
          <svg class="agent-card-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="agent-card-action" style="-webkit-line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;">${a.preview}</div>
        <div class="agent-card-tap-hint">
          <span class="agent-card-tap-hint-label">Expand</span>
          <span class="agent-card-tap-hint-time">${a.time} · ${a.company}</span>
        </div>
        <div class="agent-card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
            <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:8px 10px;">
              <div style="font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:2px;">Agent</div>
              <div style="font-size:13px;color:var(--text-secondary);">${a.agent}</div>
            </div>
            <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:8px 10px;">
              <div style="font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:2px;">Time</div>
              <div style="font-size:13px;color:var(--text-secondary);">${a.time}</div>
            </div>
            <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:8px 10px;">
              <div style="font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:2px;">Company</div>
              <div style="font-size:13px;color:var(--text-secondary);">${a.company}</div>
            </div>
            <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:8px 10px;">
              <div style="font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:2px;">Status</div>
              <div style="font-size:13px;color:${statusColor};">${a.status}</div>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:10px 12px;margin-bottom:12px;">
            <div style="font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:6px;">Approval Required</div>
            <div class="agent-card-action" style="display:block;font-style:italic;">${a.message}</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <div onclick="event.stopPropagation();this.closest('.agent-card').querySelector('[style*=italic]').style.opacity='0.4';this.textContent='✓ Approved';this.style.background='rgba(52,199,89,0.15)';this.style.color='#34C759';" style="padding:7px 16px;background:rgba(52,199,89,0.15);border:1px solid rgba(52,199,89,0.3);border-radius:8px;font-size:13px;font-weight:600;color:#34C759;cursor:pointer;">Approve & Send</div>
            <div onclick="event.stopPropagation();this.closest('.agent-card').style.opacity='0.5';this.textContent='✗ Rejected';" style="padding:7px 16px;background:rgba(255,69,58,0.12);border:1px solid rgba(255,69,58,0.25);border-radius:8px;font-size:13px;font-weight:600;color:#FF453A;cursor:pointer;">Reject</div>
          </div>
        </div>`;
      cardsWrap.appendChild(card);
      allItems.push(card);
    });

    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);
    const time = document.createElement('div');
    time.className = 'chat-time'; time.textContent = 'Now';

    wrapper.appendChild(sectionBar);
    wrapper.appendChild(sectionBody);
    wrapper.appendChild(time);
    messages.appendChild(wrapper);

    requestAnimationFrame(() => {
      if (kaiMsg) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = kaiMsg.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
      }
    });

    allItems.forEach((el, i) => {
      setTimeout(() => { el.style.opacity = ''; el.style.transform = ''; }, 120 + i * 80);
    });
  }

  // ── LEAD CARDS IN CHAT ──────────────────────────────────────────────────

  const leadData = [
    {
      id: 'marcus',
      company: 'DKR Consulting & Healthcare',
      companyShort: 'DKR Consulting',
      name: 'Marcus Williams',
      preview: 'Veteran seeking mental health support and housing assistance — called in this morning.',
      badge: 'hot',
      timestamp: 'Today, 6:42 AM',
      phone: '713-555-0182',
      email: 'marcus.w@email.com',
      source: 'Inbound Call',
      kaiNote: 'Marcus is a high-priority lead. He has a clear need — mental health support and housing assistance — and is responsive. I recommend calling him back before noon today.',
      commOverlays: [
        { id: 'comm-call-1', icon: 'call', label: 'Inbound Call', meta: 'Today, 6:42 AM · 1m 12s' },
        { id: 'comm-sms-1',  icon: 'sms',  label: 'SMS Follow-up', meta: 'Today · 6:45 AM' },
        { id: 'comm-email-1',icon: 'email', label: 'Email Thread',  meta: 'Yesterday · 3:42 PM' },
      ]
    },
    {
      id: 'sandra',
      company: 'DKR Consulting & Healthcare',
      companyShort: 'DKR Consulting',
      name: 'Sandra Lee',
      preview: 'Interested in corporate healthcare consulting — referred by Riverside Medical.',
      badge: 'new',
      timestamp: 'Yesterday',
      phone: '832-555-0241',
      email: 'sandra.lee@rivmed.com',
      source: 'Referral',
      kaiNote: 'Sandra was referred by Riverside Medical — your highest-value prospect. I\'d recommend a warm intro email within the hour. I have a draft ready for your approval.',
      commOverlays: []
    },
    {
      id: 'carlos',
      company: 'Twizted Vybz Realty',
      companyShort: 'Realty',
      name: 'Carlos Rivera',
      preview: 'Looking for a 3BR rental in Katy, TX — budget $2,200/mo, move-in next month.',
      badge: 'replied',
      timestamp: 'Yesterday',
      phone: '713-555-0374',
      email: 'c.rivera@gmail.com',
      source: 'Zillow Inquiry',
      kaiNote: 'Carlos is ready to move quickly. He\'s replied to two follow-ups and confirmed his budget. I\'d prioritize showing him properties this week before he signs elsewhere.',
      commOverlays: []
    }
  ];

  function buildCommIconSvg(type) {
    // Google Material filled icons — clean, no background box
    if (type === 'call') return '<svg width="20" height="20" viewBox="0 0 24 24" fill="#34A853"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>';
    if (type === 'sms')  return '<svg width="20" height="20" viewBox="0 0 24 24" fill="#1A73E8"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>';
    if (type === 'email')return '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#EA4335"/><path d="M6 8.5h12c.3 0 .5.2.5.5v6c0 .3-.2.5-.5.5H6c-.3 0-.5-.2-.5-.5V9c0-.3.2-.5.5-.5zm0 1.2v.8l6 3.5 6-3.5v-.8l-6 3.4-6-3.4z" fill="white"/></svg>';
    return '';
  }

  function buildLeadChatCard(lead) {
    const div = document.createElement('div');
    div.className = 'chat-card';
    div.id = 'lcc-' + lead.id;

    // Comm rows for expanded section — HISTORY style (plain list, no colored icons)
    let commRowsHtml = '';
    if (lead.commOverlays && lead.commOverlays.length) {
      lead.commOverlays.forEach(comm => {
        const iconSvg = comm.icon === 'call'
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`
          : comm.icon === 'sms'
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
        commRowsHtml += `<div onclick="event.stopPropagation();handleActivityTap('${comm.id}', '${comm.label}')" style="display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;" onmousedown="this.style.opacity='0.5'" onmouseup="this.style.opacity='1'">
          <div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iconSvg}</div>
          <div style="flex:1;"><div style="font-size:13px;font-weight:500;color:var(--text-primary);">${comm.label}</div><div style="font-size:13px;color:var(--text-tertiary);margin-top:2px;">${comm.meta}</div></div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`;
      });
    }

    div.innerHTML = `
      <div class="chat-card-top" onclick="toggleChatCard('lcc-${lead.id}')">
        <div class="chat-card-name">${lead.name}</div>
        <svg class="chat-card-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="chat-card-body-text">${lead.preview}</div>
      <div class="chat-card-hint">
        <span class="chat-card-hint-label">Expand</span>
        <span class="chat-card-hint-sub">${lead.timestamp}</span>
      </div>
      <div class="chat-card-detail">
        <div class="chat-card-kai">
          <div class="chat-card-kai-label"><div class="chat-card-kai-dot"></div>Kai recommendation</div>
          <div class="chat-card-kai-text">${lead.kaiNote}</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:6px;margin:4px 0 2px;">
          <div style="display:flex;gap:6px;align-items:center;">
            <span style="font-size:11px;font-weight:500;color:var(--text-tertiary);width:48px;flex-shrink:0;">Phone</span>
            <a href="tel:${lead.phone}" onclick="event.stopPropagation()" style="font-size:13px;color:var(--text-secondary);text-decoration:none;">${lead.phone}</a>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <span style="font-size:11px;font-weight:500;color:var(--text-tertiary);width:48px;flex-shrink:0;">Email</span>
            <a href="mailto:${lead.email}" onclick="event.stopPropagation()" style="font-size:13px;color:var(--text-secondary);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${lead.email}</a>
          </div>
        </div>

        <div class="agent-channels" style="margin:10px 0 4px;">
          <span class="agent-channel-pill voice" onclick="event.stopPropagation();sendChatWithIntent('Call ${lead.name} now')" style="cursor:pointer;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Call
          </span>
          <span class="agent-channel-pill sms" onclick="event.stopPropagation();sendChatWithIntent('Text ${lead.name}')" style="cursor:pointer;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Text
          </span>
          <span class="agent-channel-pill email" onclick="event.stopPropagation();sendChatWithIntent('Email ${lead.name}')" style="cursor:pointer;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Email
          </span>
        </div>

        ${commRowsHtml ? `<div style="margin-top:14px;">
          <div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:8px;">RECENT ACTIVITY — VIEW TRANSCRIPTS</div>
          ${commRowsHtml}
          <div onclick="event.stopPropagation();var hidden=this.previousElementSibling.querySelectorAll('.activity-hidden');var expanded=this.dataset.expanded==='true';hidden.forEach(r=>r.style.display=expanded?'none':'flex');this.dataset.expanded=expanded?'false':'true';this.textContent=expanded?'Load more ↓':'Show less ↑';var detail=this.closest('.chat-card-detail');if(detail){detail.style.height=detail.scrollHeight+'px';}" style="padding:10px 4px 16px;text-align:center;font-size:13px;color:var(--text-tertiary);cursor:pointer;border-top:1px solid rgba(255,255,255,0.05);margin-top:4px;" onmousedown="this.style.opacity='0.5'" onmouseup="this.style.opacity='1'">Load more ↓</div>
        </div>` : ''}
      </div>`;

    return div;
  }

    function toggleChatCard(id) {
    const card = document.getElementById(id);
    if (!card) return;
    const isOpen = card.classList.toggle('open');
    if (isOpen) {
      setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
    }
  }

  function toggleChatSection(bar) {
    const body = bar.nextElementSibling;
    if (!body) return;
    const collapsed = body.classList.toggle('collapsed');
    bar.classList.toggle('collapsed', collapsed);
  }

  function addHelpCardToChat(kaiMsg) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai';

    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.setAttribute('data-kicker', 'Quick Start');
    sectionBar.setAttribute('data-desc', `Everything you can ask Kai. Tap anything to get started.`);
    sectionBar.innerHTML = '<span class="chat-section-bar-title">Help & Quick Commands</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:16px;width:100%;margin-top:4px;opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';

    const groups = [
      { label: 'View Activity', items: [
        { cmd: 'Show me my calls', desc: 'Everything Kai did on the phone today' },
        { cmd: 'Show me financials', desc: 'Invoices, payments, and financial agents' },
        { cmd: 'Show me my leads', desc: 'Active leads and agent activity' },
        { cmd: 'Show me my approvals', desc: 'Items waiting for your decision' },
        { cmd: 'Show me my morning briefing', desc: 'Overnight summary and priorities' },
      ]},
      { label: 'View Specific', items: [
        { cmd: 'Show me the lead for [name]', desc: 'Pull up one specific lead' },
        { cmd: 'Tell me about [name]', desc: 'Same as above' },
        { cmd: 'Show me the flagged message', desc: 'Supervisor-held message' },
        { cmd: 'Show me my bookkeeping summary', desc: 'Xero summary' },
        { cmd: 'Show me business health', desc: 'Revenue dashboard' },
      ]},
      { label: 'Settings & Account', items: [
        { cmd: 'Show me my settings', desc: 'All settings' },
        { cmd: 'Show me my billing', desc: 'Plan and billing' },
        { cmd: 'Show me my usage', desc: 'Message usage' },
        { cmd: 'Show me my connectors', desc: 'Connected services' },
        { cmd: 'I want to upgrade my plan', desc: 'Upgrade AcaiOS plan' },
      ]},
      { label: 'About', items: [
        { cmd: 'What is AcaiOS', desc: 'Learn what this app does' },
        { cmd: 'Tell me about the AI models', desc: 'Haiku, Sonnet, Opus explained' },
      ]},
    ];

    groups.forEach(g => {
      const groupWrap = document.createElement('div');
      groupWrap.style.cssText = 'display:flex;flex-direction:column;gap:0;';

      const label = document.createElement('div');
      label.style.cssText = 'font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:8px;padding:0 4px;';
      label.textContent = g.label;
      groupWrap.appendChild(label);

      const card = document.createElement('div');
      card.className = 'agent-card';
      card.style.cssText = 'cursor:default;overflow:hidden;';
      card.innerHTML = g.items.map((item, i) => `
        ${i > 0 ? '' : ''}
        <div onclick="sendChatWithIntent('${item.cmd.replace('[name]','Marcus Williams')}')" style="display:flex;align-items:center;gap:14px;padding:16px;cursor:pointer;" onmousedown="this.style.background='rgba(255,255,255,0.06)'" onmouseup="this.style.background=''">
          <div style="flex:1;min-width:0;">
            <div style="font-size:17px;font-weight:500;color:var(--text-primary);letter-spacing:-0.01em;">${item.cmd}</div>
            <div style="font-size:13px;color:var(--text-tertiary);margin-top:3px;">${item.desc}</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`).join('');

      groupWrap.appendChild(card);
      cardsWrap.appendChild(groupWrap);
    });

    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);
    const time = document.createElement('div'); time.className = 'chat-time'; time.textContent = 'Now';
    wrapper.appendChild(sectionBar); wrapper.appendChild(sectionBody); wrapper.appendChild(time);
    messages.appendChild(wrapper);

    requestAnimationFrame(() => {
      if (kaiMsg) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = kaiMsg.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
      }
    });
    setTimeout(() => { cardsWrap.style.opacity = ''; cardsWrap.style.transform = ''; }, 120);
  }

  function addFlaggedMessageToChat(kaiMsg) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai';
    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.innerHTML = '<span class="chat-section-bar-title">Flagged Message</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';
    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:0;width:100%;margin-top:4px;opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';
    cardsWrap.innerHTML = `
      <div class="agent-card" style="cursor:default;">
        <div class="agent-card-top" style="flex-direction:column;align-items:flex-start;gap:10px;padding:16px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;border-radius:50%;background:#FF453A;flex-shrink:0;"></div>
            <div class="agent-card-name">Collections Agent — Flagged by Supervisor</div>
          </div>
          <div class="agent-card-action" style="display:block;padding:12px;background:rgba(255,69,58,0.08);border:1px solid rgba(255,69,58,0.2);border-radius:12px;font-size:13px;line-height:1.6;">"Hi Riverside Medical, as discussed we guarantee full refund within 30 days if the retainer does not deliver results."</div>
          <div class="agent-card-time">Flagged 8:42 AM · Collections Agent · DKR Consulting</div>
          <div class="agent-card-time" style="color:rgba(255,69,58,0.8);">⚠ Contains financial guarantee — requires your approval before sending.</div>
          <div style="display:flex;gap:8px;margin-top:4px;">
            <div onclick="this.closest('.agent-card').innerHTML='<div style=\\'padding:14px;font-size:14px;color:#34C759;\\'>✓ Message approved and sent.</div>'" style="padding:7px 16px;background:rgba(52,199,89,0.15);border:1px solid rgba(52,199,89,0.3);border-radius:8px;font-size:13px;font-weight:600;color:#34C759;cursor:pointer;">Approve & Send</div>
            <div onclick="this.closest('.agent-card').innerHTML='<div style=\\'padding:14px;font-size:14px;color:#FF453A;\\'>✗ Message rejected and deleted.</div>'" style="padding:7px 16px;background:rgba(255,69,58,0.12);border:1px solid rgba(255,69,58,0.25);border-radius:8px;font-size:13px;font-weight:600;color:#FF453A;cursor:pointer;">Reject</div>
          </div>
        </div>
      </div>`;
    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);
    const time = document.createElement('div'); time.className = 'chat-time'; time.textContent = 'Now';
    wrapper.appendChild(sectionBar); wrapper.appendChild(sectionBody); wrapper.appendChild(time);
    messages.appendChild(wrapper);
    requestAnimationFrame(() => { if (kaiMsg) { const msgsRect = messages.getBoundingClientRect(); const msgRect = kaiMsg.getBoundingClientRect(); messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16; } });
    setTimeout(() => { cardsWrap.style.opacity = ''; cardsWrap.style.transform = ''; }, 120);
  }

  function addMorningBriefingToChat(kaiMsg) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai';
    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.innerHTML = '<span class="chat-section-bar-title">Morning Briefing</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';
    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:16px;width:100%;margin-top:4px;opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';
    const items = [
      { label: 'Overnight Activity', body: '2 calls answered. 1 invoice sent. 3 new leads responded to. 1 message flagged by the Supervisor.' },
      { label: 'Priority Today', body: 'Strategy call with Marcus Williams at 2PM. Proposal due to Riverside Medical by EOD. Follow-up draft for Sandra Lee awaiting your approval.' },
      { label: 'Revenue', body: '$3,200 in payments received yesterday. $8,500 invoice outstanding — Riverside Medical day 0.' },
      { label: 'Agent Status', body: 'All 12 agents active. Operations Supervisor in Gatekeeper Mode. No failed workflows overnight.' },
    ];
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'agent-card';
      card.style.cssText = 'cursor:default;';
      card.innerHTML = `<div class="agent-card-top" style="flex-direction:column;align-items:flex-start;gap:6px;padding:14px 16px;"><div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);">${item.label}</div><div class="agent-card-action" style="display:block;">${item.body}</div></div>`;
      cardsWrap.appendChild(card);
    });
    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);
    const time = document.createElement('div'); time.className = 'chat-time'; time.textContent = 'Now';
    wrapper.appendChild(sectionBar); wrapper.appendChild(sectionBody); wrapper.appendChild(time);
    messages.appendChild(wrapper);
    requestAnimationFrame(() => { if (kaiMsg) { const msgsRect = messages.getBoundingClientRect(); const msgRect = kaiMsg.getBoundingClientRect(); messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16; } });
    setTimeout(() => { cardsWrap.style.opacity = ''; cardsWrap.style.transform = ''; }, 120);
  }

  function addBookkeepingSummaryToChat(kaiMsg) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai';
    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.innerHTML = '<span class="chat-section-bar-title">Bookkeeping Summary</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';
    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:0;width:100%;margin-top:4px;opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';
    cardsWrap.innerHTML = `
      <div class="agent-card" style="cursor:default;">
        <div class="agent-card-top" style="flex-direction:column;align-items:flex-start;gap:14px;padding:16px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;">
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:12px;"><div style="font-size:10px;font-weight:600;letter-spacing:.06em;color:var(--text-tertiary);margin-bottom:4px;">TOTAL INCOME</div><div style="font-size:20px;font-weight:700;color:#34C759;">$14,200</div></div>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:12px;"><div style="font-size:10px;font-weight:600;letter-spacing:.06em;color:var(--text-tertiary);margin-bottom:4px;">TOTAL EXPENSES</div><div style="font-size:20px;font-weight:700;color:#FF453A;">$3,840</div></div>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:12px;"><div style="font-size:10px;font-weight:600;letter-spacing:.06em;color:var(--text-tertiary);margin-bottom:4px;">OUTSTANDING</div><div style="font-size:20px;font-weight:700;color:#FF9500;">$8,500</div></div>
            <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:12px;"><div style="font-size:10px;font-weight:600;letter-spacing:.06em;color:var(--text-tertiary);margin-bottom:4px;">UNCATEGORIZED</div><div style="font-size:20px;font-weight:700;color:#FF9500;">3</div></div>
          </div>
          <div style="width:100%;"><div style="font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:8px;">Flagged Items</div>
            <div style="font-size:13px;color:var(--text-secondary);line-height:1.8;">· 3 uncategorized expenses need review<br>· Riverside Medical invoice ($8,500) outstanding<br>· All invoices synced to Xero</div>
          </div>
          <div style="display:flex;gap:8px;">
            <div onclick="event.stopPropagation();" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View in Xero</div>
            <div onclick="event.stopPropagation();sendChatWithIntent('show me financials')" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">Full Financial Activity</div>
          </div>
        </div>
      </div>`;
    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);
    const time = document.createElement('div'); time.className = 'chat-time'; time.textContent = 'Now';
    wrapper.appendChild(sectionBar); wrapper.appendChild(sectionBody); wrapper.appendChild(time);
    messages.appendChild(wrapper);
    requestAnimationFrame(() => { if (kaiMsg) { const msgsRect = messages.getBoundingClientRect(); const msgRect = kaiMsg.getBoundingClientRect(); messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16; } });
    setTimeout(() => { cardsWrap.style.opacity = ''; cardsWrap.style.transform = ''; }, 120);
  }

  function addSingleLeadToChat(kaiMsg, name) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    // Find matching lead card in the overlay and clone it
    const allCards = document.querySelectorAll('#overlay-leads .agent-card');
    let matchCard = null;
    allCards.forEach(card => {
      const cardName = card.querySelector('.agent-card-name');
      if (cardName && cardName.textContent.toLowerCase().includes(name.toLowerCase())) {
        matchCard = card;
      }
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai'; wrapper.dataset.type = 'single-lead';

    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.innerHTML = `<span class="chat-section-bar-title">${name}</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>`;

    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:0;width:100%;margin-top:4px;opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';

    if (matchCard) {
      const clone = matchCard.cloneNode(true);
      clone.classList.remove('open');
      clone.onclick = function() { toggleAgentCard(this); };
      cardsWrap.appendChild(clone);
    } else {
      cardsWrap.innerHTML = `<div style="padding:16px;font-size:13px;color:var(--text-secondary);">No lead found for "${name}". They may not be in the system yet.</div>`;
    }

    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);
    const time = document.createElement('div');
    time.className = 'chat-time'; time.textContent = 'Now';

    wrapper.appendChild(sectionBar);
    wrapper.appendChild(sectionBody);
    wrapper.appendChild(time);
    messages.appendChild(wrapper);

    requestAnimationFrame(() => {
      if (kaiMsg) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = kaiMsg.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
      }
    });
    setTimeout(() => { cardsWrap.style.opacity = ''; cardsWrap.style.transform = ''; }, 120);
  }

  function addLeadCardsToChat(kaiMsg, filter) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    let leads = [
      {
        name: 'Marcus Williams', company: 'DKR Consulting', badge: 'Hot Lead', badgeClass: 'active', type: 'hot',
        preview: 'VP of Operations · Helix Health Systems · Replied yesterday',
        detail: 'Needs follow up before 2 PM today. Speed to Lead Agent drafted a callback script — awaiting your approval.',
        meta: 'Replied yesterday · LinkedIn referral',
        contact: { email: 'm.williams@helixhealth.com', phone: '(713) 555-0182', co: 'Helix Health Systems', value: '$3,500 est.' },
        comms: [
          { id: 'Show me the call transcript from Marcus Williams', type: 'call', title: 'Inbound Call', meta: 'Today · 6:42 AM', hidden: false },
          { id: 'Show me the SMS to Marcus Williams',  type: 'sms',  title: 'SMS Thread',   meta: 'Today · 6:45 AM', hidden: false },
          { id: 'Show me the email to Marcus Williams',type: 'email', title: 'Email Thread', meta: 'Yesterday · 3:42 PM', hidden: false },
          { id: 'Show me the call transcript from Marcus Williams', type: 'call', title: 'Outbound Call', meta: 'May 16 · 9:04 AM', hidden: true },
          { id: 'Show me the email to Marcus Williams', type: 'email', title: 'Intro Email', meta: 'May 16 · 9:00 AM', hidden: true },
        ]
      },
      {
        name: 'Sandra Lee', company: 'DKR Consulting', badge: 'New Lead', badgeClass: 'active', type: 'new',
        preview: 'Requested pricing · Inbound Agent responded at 6:52 AM',
        detail: 'Healthcare consulting inquiry. Referred by Riverside Medical. Inbound Agent sent intro email. Kai has it ready for your review.',
        meta: 'Today, 6:52 AM · Referral',
        contact: { email: 'sandra.lee@rivmed.com', phone: '(832) 555-0241', co: 'Riverside Medical', value: '' },
        comms: [
          { id: 'Show me the call transcript from Sandra Lee', type: 'call', title: 'Inbound Call', meta: 'Today · 8:51 AM', hidden: false },
          { id: 'Show me the email to Sandra Lee', type: 'email', title: 'Intro Email', meta: 'Today · 8:52 AM', hidden: false },
        ]
      },
      {
        name: 'James Porter', company: 'DKR Consulting', badge: 'New Inbound', badgeClass: 'active', type: 'new',
        preview: 'Website form · 9:04 AM · Speed to Lead Agent responded automatically',
        detail: 'Submitted contact form this morning. Speed to Lead Agent replied within 60 seconds. Needs your personal follow-up.',
        meta: 'Today, 9:04 AM · Web form',
        contact: { email: '', phone: '', co: 'DKR Consulting', value: '' },
        comms: [
          { id: 'Show me the call transcript from James Porter', type: 'call', title: 'Speed to Lead Call', meta: 'Today · 9:05 AM', hidden: false },
          { id: 'Show me the SMS to James Porter', type: 'sms', title: 'SMS Follow-up', meta: 'Today · 9:06 AM', hidden: false },
        ]
      },
      {
        name: 'Lance', company: 'Twizted Vybz Realty', badge: 'Hot Lead', badgeClass: 'active', type: 'hot',
        preview: 'Westin Homes · needs next step summary · Yesterday',
        detail: 'Active buyer. Toured 3 properties last week. Ready to make an offer — send next steps.',
        meta: 'Yesterday · Westin Homes',
        contact: { email: '', phone: '', co: 'Westin Homes', value: '' },
        comms: [
          { id: 'Show me the call transcript from Lance', type: 'call', title: 'Inbound Call', meta: 'Yesterday · 2:30 PM', hidden: false },
          { id: 'Show me the SMS to Lance', type: 'sms', title: 'SMS Thread', meta: 'Yesterday · 3:15 PM', hidden: false },
        ]
      },
    ];

    const commIconSvg = (type) => {
      if (type === 'call')  return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
      if (type === 'sms')   return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
      if (type === 'email') return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';
      return '';
    };

    // Apply filter
    if (filter === 'hot') leads = leads.filter(l => l.type === 'hot');
    else if (filter === 'new') leads = leads.filter(l => l.type === 'new');
    else if (filter === 'dkr') leads = leads.filter(l => l.company.toLowerCase().includes('dkr'));
    else if (filter === 'realty') leads = leads.filter(l => l.company.toLowerCase().includes('realty'));

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai'; wrapper.dataset.type = 'leads';
    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:16px;width:100%;margin-top:4px;';
    const time = document.createElement('div');
    time.className = 'chat-time'; time.textContent = 'Now';

    const lbl = document.createElement('div');
    lbl.className = 'section-label';
    lbl.style.cssText = 'margin-bottom:4px;opacity:0;transition:opacity 0.22s ease;';
    lbl.textContent = 'Active Leads';
    cardsWrap.appendChild(lbl);

    const cards = leads.map((lead, idx) => {
      const cardId = 'lead-chat-' + idx;
      const card = document.createElement('div');
      card.className = 'agent-card';
      card.id = cardId;
      card.style.cssText = 'opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';
      card.onclick = function() { toggleAgentCard(this); };

      const contactRows = [
        lead.contact.email ? `<div class="lead-stat-row"><span class="lead-stat-label">Email</span><a href="mailto:${lead.contact.email}" class="lead-stat-value lead-stat-link" onclick="event.stopPropagation()">${lead.contact.email}</a></div>` : '',
        lead.contact.phone ? `<div class="lead-stat-row"><span class="lead-stat-label">Phone</span><a href="tel:${lead.contact.phone}" class="lead-stat-value lead-stat-link" onclick="event.stopPropagation()">${lead.contact.phone}</a></div>` : '',
        lead.contact.co    ? `<div class="lead-stat-row"><span class="lead-stat-label">Company</span><span class="lead-stat-value">${lead.contact.co}</span></div>` : '',
        lead.contact.value ? `<div class="lead-stat-row"><span class="lead-stat-label">Est. Value</span><span class="lead-stat-value">${lead.contact.value}</span></div>` : '',
      ].join('');

      const commRows = lead.comms.map(c => `
        <div class="${c.hidden ? 'activity-hidden' : ''}" onclick="event.stopPropagation();handleActivityTap('${c.id}', '${c.title}')" style="display:${c.hidden ? 'none' : 'flex'};align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;" onmousedown="this.style.opacity='0.5'" onmouseup="this.style.opacity='1'">
          <div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${commIconSvg(c.type)}</div>
          <div style="flex:1;"><div style="font-size:13px;font-weight:500;color:var(--text-primary);">${c.title}</div><div style="font-size:13px;color:var(--text-tertiary);margin-top:2px;">${c.meta}</div></div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`).join('');

      card.innerHTML = `
        <div class="agent-card-top">
          <div class="agent-card-name">${lead.name}</div>
          <div class="agent-status ${lead.badgeClass}"><div class="agent-status-dot"></div>${lead.badge}</div>
          <svg class="agent-card-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="agent-card-preview">${lead.preview}</div>
        <div class="agent-card-action">${lead.detail}</div>
        <div class="agent-card-tap-hint">
          <span class="agent-card-tap-hint-label">Expand</span>
          <span class="agent-card-tap-hint-time">${lead.company}</span>
        </div>
        <div class="agent-card-body">
          ${contactRows ? `<div style="margin-bottom:16px;">${contactRows}</div>` : ''}
          <div class="agent-channels" style="margin-bottom:${commRows ? '16px' : '0'};">
            <button class="agent-channel-pill voice" style="cursor:pointer;" onclick="event.stopPropagation();sendChatWithIntent('Call ${lead.name}')"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Call</button>
            <button class="agent-channel-pill sms" style="cursor:pointer;" onclick="event.stopPropagation();sendChatWithIntent('Text ${lead.name}')"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Text</button>
            <button class="agent-channel-pill email" style="cursor:pointer;" onclick="event.stopPropagation();sendChatWithIntent('Email ${lead.name}')"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Email</button>
          </div>
          ${commRows ? `<div style="margin-top:4px;"><div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:4px;">RECENT ACTIVITY — VIEW TRANSCRIPTS</div><div style="display:flex;flex-direction:column;">${commRows}</div><div onclick="event.stopPropagation();var hidden=this.previousElementSibling.querySelectorAll('.activity-hidden');var expanded=this.dataset.expanded==='true';hidden.forEach(r=>r.style.display=expanded?'none':'flex');this.dataset.expanded=expanded?'false':'true';this.textContent=expanded?'Load more ↓':'Show less ↑';var detail=this.closest('.chat-card-detail');if(detail){detail.style.height=detail.scrollHeight+'px';}" style="padding:10px 4px 16px;text-align:center;font-size:13px;color:var(--text-tertiary);cursor:pointer;border-top:1px solid rgba(255,255,255,0.05);margin-top:4px;" onmousedown="this.style.opacity='0.5'" onmouseup="this.style.opacity='1'">Load more ↓</div></div>` : ''}
        </div>`;
      cardsWrap.appendChild(card);
      return card;
    });

    // Collapse bar
    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.setAttribute('data-kicker', 'Your Pipeline');
    sectionBar.setAttribute('data-desc', 'Every opportunity stays moving. Kai keeps new leads organized, followed up, and ready for the next action.');
    sectionBar.setAttribute('data-pills', '● 8 active|3 need attention|2 approvals');
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.innerHTML = '<span class="chat-section-bar-title">Leads</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

    // Wrap cardsWrap in collapsible body
    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);

    wrapper.appendChild(sectionBar);
    wrapper.appendChild(sectionBody);
    wrapper.appendChild(time);
    messages.appendChild(wrapper);

    requestAnimationFrame(() => {
      if (kaiMsg) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = kaiMsg.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
      }
    });

    setTimeout(() => { lbl.style.opacity = ''; }, 120);
    cards.forEach((card, i) => {
      setTimeout(() => { card.style.opacity = ''; card.style.transform = ''; }, 200 + i * 80);
    });
  }

  // ── TASKS IN CHAT ────────────────────────────────────────────────────────────

  const taskChatData = [
    { id: "tct-1", title: "Send Riverside Medical proposal", meta: "$8,500 retainer · Kai has draft ready", company: "DKR Consulting", due: "EOD today", priority: "high", hint: "EOD today" },
    { id: "tct-2", title: "Follow-up · Marcus Williams", meta: "Lead Nurture Agent drafted · Kai waiting for your approval", company: "DKR Consulting", due: "2:00 PM", priority: "high", hint: "2:00 PM" },
    { id: "tct-3", title: "Strategy call · Marcus Williams", meta: "Google Meet · Link in calendar", company: "DKR Consulting", due: "2:00 PM", priority: "medium", hint: "2:00 PM" },
    { id: "tct-4", title: "Review weekly report", meta: "Operations Supervisor generates Friday at 5 PM", company: "All Companies", due: "Fri", priority: "medium", hint: "Fri" },
    { id: "tct-5", title: "Onboard Carlos Rivera", meta: "Strategy session · Send welcome packet", company: "DKR Consulting", due: "Thu", priority: "medium", hint: "Thu" },
    { id: "tct-6", title: "Review GFT & Streetwear sites", meta: "Both in build · AcaiOS building", company: "Multiple", due: "Next week", priority: "low", hint: "Next week" }
  ];

  function buildTaskChatCard(task) {
    const div = document.createElement('div');
    div.className = 'chat-card';
    div.id = task.id;

    const priorityDot = task.priority === 'high'
      ? 'rgba(255,255,255,0.8)'
      : task.priority === 'medium'
        ? 'rgba(255,255,255,0.35)'
        : 'rgba(255,255,255,0.12)';

    div.innerHTML = `
      <div class="chat-card-top" onclick="toggleChatCard('${task.id}')">
        <div class="chat-card-name">${task.title}</div>
        <svg class="chat-card-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="chat-card-body-text">${task.meta} · ${task.company}</div>
      <div class="chat-card-hint">
        <span class="chat-card-hint-label">Expand</span>
        <span class="chat-card-hint-sub" style="display:flex;align-items:center;gap:5px;">
          <span style="width:6px;height:6px;border-radius:50%;background:${priorityDot};display:inline-block;flex-shrink:0;"></span>
          ${task.hint}
        </span>
      </div>
      <div class="chat-card-detail">
        <div class="chat-card-kai">
          <div class="chat-card-kai-label"><div class="chat-card-kai-dot"></div>${task.company}</div>
          <div class="chat-card-kai-text">${task.meta}</div>
        </div>
        <div class="chat-card-actions">
          <button class="chat-card-btn primary" onclick="event.stopPropagation();sendChatWithIntent('${task.title}')">Handle now</button>
          <button class="chat-card-btn secondary" onclick="event.stopPropagation();sendChatWithIntent('Mark done: ${task.title}')">Mark done</button>
        </div>
      </div>`;

    return div;
  }

  function addTaskCardsToChat(kaiMsg) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    const tasks = [
      { title: 'Send Riverside Medical proposal', meta: '$8,500 retainer · Kai has draft ready', time: 'EOD today', company: 'DKR Consulting', priority: 'urgent',
        actions: `<div onclick="event.stopPropagation();sendChatWithIntent('Show me the proposal draft for Riverside Medical')" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;display:inline-block;">View Draft</div>
        <div onclick="event.stopPropagation();" style="padding:6px 14px;background:rgba(52,199,89,0.15);border:1px solid rgba(52,199,89,0.3);border-radius:8px;font-size:13px;font-weight:600;color:#34C759;cursor:pointer;display:inline-block;">Send</div>` },
      { title: 'Follow-up · Marcus Williams', meta: 'Lead Nurture Agent drafted · Awaiting your approval', time: '2:00 PM', company: 'DKR Consulting', priority: 'today',
        actions: `<div onclick="event.stopPropagation();sendChatWithIntent('Show me the lead for Marcus Williams')" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;display:inline-block;">View Lead</div>
        <div onclick="event.stopPropagation();" style="padding:6px 14px;background:rgba(52,199,89,0.15);border:1px solid rgba(52,199,89,0.3);border-radius:8px;font-size:13px;font-weight:600;color:#34C759;cursor:pointer;display:inline-block;">Approve Draft</div>` },
      { title: 'Strategy call · Marcus Williams', meta: 'Google Meet · Link in calendar', time: '2:00 PM', company: 'DKR Consulting', priority: 'today',
        actions: `<div onclick="event.stopPropagation();sendChatWithIntent('Show me my calendar')" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;display:inline-block;">View Calendar</div>` },
      { title: 'Review Sandra Lee follow-up draft', meta: 'Collections Agent drafted · Kai waiting for your approval', time: '4:00 PM', company: 'DKR Consulting', priority: 'today',
        actions: `<div onclick="event.stopPropagation();" style="padding:6px 14px;background:rgba(52,199,89,0.15);border:1px solid rgba(52,199,89,0.3);border-radius:8px;font-size:13px;font-weight:600;color:#34C759;cursor:pointer;display:inline-block;">Approve</div>
        <div onclick="event.stopPropagation();" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;display:inline-block;">Edit</div>` },
      { title: 'Review Xero bookkeeping — 3 uncategorized', meta: 'Xero flagged 3 expenses', time: 'EOD today', company: 'All Companies', priority: 'today',
        actions: `<div onclick="event.stopPropagation();sendChatWithIntent('Show me my bookkeeping summary')" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;display:inline-block;">View Summary</div>` },
    ];

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai'; wrapper.dataset.type = 'tasks';

    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.innerHTML = '<span class="chat-section-bar-title">Tasks</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:16px;width:100%;margin-top:4px;';

    const allItems = [];

    tasks.forEach(t => {
      const card = document.createElement('div');
      card.className = 'agent-card';
      card.style.cssText = 'opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';
      card.onclick = function() { toggleAgentCard(this); };
      card.innerHTML = `
        <div class="agent-card-top">
          <div class="agent-card-name">${t.title}</div>
          <div class="agent-status active"><div class="agent-status-dot"></div></div>
          <svg class="agent-card-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="agent-card-action" style="-webkit-line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;">${t.meta}</div>
        <div class="agent-card-tap-hint">
          <span class="agent-card-tap-hint-label">Expand</span>
          <span class="agent-card-tap-hint-time">${t.time} · ${t.company}</span>
        </div>
        <div class="agent-card-body">
          <div class="agent-card-action" style="margin-bottom:10px;">${t.meta}</div>
          <div class="agent-card-time" style="margin-bottom:10px;">${t.time} · ${t.company}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">${t.actions}</div>
        </div>`;
      cardsWrap.appendChild(card);
      allItems.push(card);
    });

    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);
    const time = document.createElement('div');
    time.className = 'chat-time'; time.textContent = 'Now';

    wrapper.appendChild(sectionBar);
    wrapper.appendChild(sectionBody);
    wrapper.appendChild(time);
    messages.appendChild(wrapper);

    requestAnimationFrame(() => {
      if (kaiMsg) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = kaiMsg.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
      }
    });

    allItems.forEach((el, i) => {
      setTimeout(() => { el.style.opacity = ''; el.style.transform = ''; }, 120 + i * 80);
    });
  }

  // ── CALENDAR IN CHAT ─────────────────────────────────────────────────────────

  const calendarChatData = [
    { id: "ccc-1", title: "Morning briefing — Kai", meta: "Sent to your phone · All companies", time: "7:00 AM", tag: "Today", hint: "7:00 AM" },
    { id: "ccc-2", title: "Strategy call · Marcus Williams", meta: "Google Meet · DKR Consulting", time: "2:00 PM", tag: "Today", hint: "2:00 PM" },
    { id: "ccc-3", title: "Proposal due — Riverside Medical", meta: "$8,500 retainer · Kai has draft ready", time: "EOD", tag: "Today", hint: "Urgent" },
    { id: "ccc-4", title: "Follow-up — Sandra Lee", meta: "Kai drafting · Awaiting your approval", time: "4:00 PM", tag: "Today", hint: "4:00 PM" },
    { id: "ccc-5", title: "Weekly pipeline review", meta: "Kai prepares summary · All companies", time: "9:00 AM", tag: "Tomorrow", hint: "Tomorrow" },
    { id: "ccc-6", title: "Onboarding — Carlos Rivera", meta: "Zoom · Send welcome packet beforehand", time: "11:00 AM", tag: "Tomorrow", hint: "Tomorrow" }
  ];

  function buildCalendarChatCard(evt) {
    const div = document.createElement('div');
    div.className = 'chat-card';
    div.id = evt.id;

    div.innerHTML = `
      <div class="chat-card-top" onclick="toggleChatCard('${evt.id}')">
        <div class="chat-card-name">${evt.title}</div>
        <svg class="chat-card-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="chat-card-body-text">${evt.meta}</div>
      <div class="chat-card-hint">
        <span class="chat-card-hint-label">Expand</span>
        <span class="chat-card-hint-sub">${evt.tag} · ${evt.hint}</span>
      </div>
      <div class="chat-card-detail">
        <div class="chat-card-kai">
          <div class="chat-card-kai-label"><div class="chat-card-kai-dot"></div>${evt.tag} · ${evt.time}</div>
          <div class="chat-card-kai-text">${evt.meta}</div>
        </div>
        <div class="chat-card-actions">
          <button class="chat-card-btn primary" onclick="event.stopPropagation();sendChatWithIntent('Tell me more about: ${evt.title}')">Details</button>
          <button class="chat-card-btn secondary" onclick="event.stopPropagation();sendChatWithIntent('Reschedule: ${evt.title}')">Reschedule</button>
        </div>
      </div>`;

    return div;
  }

  function addCalendarCardsToChat(kaiMsg) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai'; wrapper.dataset.type = 'calendar';
    wrapper.style.cssText = 'width:100%;box-sizing:border-box;';
    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:13px;width:100%;margin-top:4px;box-sizing:border-box;';
    const time = document.createElement('div');
    time.className = 'chat-time'; time.textContent = 'Now';

    // Build week strip — compact for chat
    const strip = document.createElement('div');
    strip.className = 'cal-week-strip';
    strip.style.cssText = 'padding:0 0 16px;gap:4px;';
    strip.id = 'cal-week-strip-chat2';

    // Build events container
    const eventsDiv = document.createElement('div');
    eventsDiv.id = 'cal-events-container-chat2';
    eventsDiv.style.cssText = 'display:flex;flex-direction:column;gap:13px;';

    cardsWrap.appendChild(strip);
    cardsWrap.appendChild(eventsDiv);
    // Collapse bar
    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.setAttribute('data-kicker', 'Your Schedule');
    sectionBar.setAttribute('data-desc', `Your day stays organized around the work that matters. Kai highlights calls, deadlines, follow-ups, and approval windows before they slip.`);
    sectionBar.setAttribute('data-pills', '● 4 today|2 need prep|1 deadline');
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.innerHTML = '<span class="chat-section-bar-title">Calendar</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

    // Wrap cardsWrap in collapsible body
    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);

    wrapper.appendChild(sectionBar);
    wrapper.appendChild(sectionBody);
    wrapper.appendChild(time);
    messages.appendChild(wrapper);

    cardsWrap.style.opacity = '0';
    cardsWrap.style.transform = 'translateY(10px)';
    cardsWrap.style.transition = 'opacity 0.22s ease, transform 0.22s ease';

    // Populate using existing calendar build functions pointed at new IDs
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    let todayKey = '';
    for (let i = -1; i <= 6; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const dateKey = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      if (i === 0) todayKey = dateKey;
      const pill = document.createElement('div');
      pill.className = 'cal-day-pill' + (i === 0 ? ' today selected' : '');
      pill.dataset.date = dateKey;
      pill.style.cssText = 'padding:6px 8px 8px;min-width:36px;gap:4px;';
      const hasDot = typeof calEvents !== 'undefined' && calEvents[dateKey];
      pill.innerHTML = `<div class="cal-day-name" style="font-size:9px;">${days[d.getDay()]}</div><div class="cal-day-num" style="font-size:16px;">${d.getDate()}</div><div class="cal-day-dot" style="${hasDot ? '' : 'background:transparent;'}"></div>`;
      pill.onclick = () => {
        strip.querySelectorAll('.cal-day-pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        renderChatCalEvents2(dateKey);
      };
      strip.appendChild(pill);
    }

    function renderChatCalEvents2(dateKey) {
      if (typeof calEvents === 'undefined') return;
      const events = calEvents[dateKey] || [];
      const d = new Date(dateKey);
      const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const todayD = new Date();
      const todayKey2 = `${todayD.getFullYear()}-${pad(todayD.getMonth()+1)}-${pad(todayD.getDate())}`;
      const label = dateKey === todayKey2 ? 'Today' : dayNames[d.getDay()];
      eventsDiv.innerHTML = '';
      if (!events.length) {
        eventsDiv.innerHTML = `<div style="padding:20px 18px;font-size:13px;color:rgba(255,255,255,0.35);">No events for ${label}</div>`;
        return;
      }

      events.forEach(evt => {
        const row = document.createElement('div');
        row.style.cssText = 'background:rgba(255,255,255,0.042);border:1px solid rgba(255,255,255,0.055);border-radius:22px;padding:22px 24px 19px;cursor:pointer;transition:background 0.15s;';

        // Determine action buttons based on event content
        let actions = '';
        const t = (evt.title || '').toLowerCase();
        const m = (evt.meta || '').toLowerCase();
        if (t.includes('marcus') || t.includes('williams')) {
          actions = `<div onclick="event.stopPropagation();sendChatWithIntent('Show me the lead for Marcus Williams')" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;display:inline-block;">View Lead</div>`;
        } else if (t.includes('sandra') || t.includes('lee')) {
          actions = `<div style="display:flex;gap:8px;">
            <div onclick="event.stopPropagation();" style="padding:6px 14px;background:rgba(52,199,89,0.15);border:1px solid rgba(52,199,89,0.3);border-radius:8px;font-size:13px;font-weight:600;color:#34C759;cursor:pointer;">Approve</div>
            <div onclick="event.stopPropagation();sendChatWithIntent('Show me the follow-up draft for Sandra Lee')" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View Draft</div>
          </div>`;
        } else if (t.includes('proposal') || t.includes('riverside') || m.includes('draft')) {
          actions = `<div style="display:flex;gap:8px;">
            <div onclick="event.stopPropagation();sendChatWithIntent('Show me the proposal draft for Riverside Medical')" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View Draft</div>
            <div onclick="event.stopPropagation();" style="padding:6px 14px;background:rgba(52,199,89,0.15);border:1px solid rgba(52,199,89,0.3);border-radius:8px;font-size:13px;font-weight:600;color:#34C759;cursor:pointer;">Send</div>
          </div>`;
        } else if (t.includes('briefing') || t.includes('kai')) {
          actions = `<div onclick="event.stopPropagation();sendChatWithIntent('Show me my morning briefing')" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;display:inline-block;">View Briefing</div>`;
        } else {
          actions = `<div onclick="event.stopPropagation();sendChatWithIntent('Tell me about ${evt.title}')" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;display:inline-block;">View Details</div>`;
        }

        const actionsDiv = document.createElement('div');
        actionsDiv.style.cssText = 'display:none;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);';
        actionsDiv.innerHTML = actions;

        row.innerHTML = `
          <div style="display:grid;grid-template-columns:78px 1fr auto;gap:14px;align-items:flex-start;">
            <div>
              <div style="font-size:22px;line-height:1.05;letter-spacing:-0.035em;font-weight:760;color:var(--text-primary);">${evt.time}</div>
              <div style="margin-top:6px;color:rgba(255,255,255,0.25);font-size:13px;">${evt.duration||''}</div>
            </div>
            <div style="min-width:0;">
              <div style="font-size:24px;line-height:1.14;letter-spacing:-0.04em;font-weight:760;color:var(--text-primary);">${evt.title}</div>
              <div style="margin-top:8px;color:rgba(255,255,255,0.48);font-size:16px;line-height:1.35;">${evt.meta||''}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:8px;transition:transform 0.2s;"><polyline points="6 9 12 15 18 9"/></svg>
          </div>`;
        row.appendChild(actionsDiv);

        row.onclick = () => {
          const open = actionsDiv.style.display === 'block';
          actionsDiv.style.display = open ? 'none' : 'block';
          const chevron = row.querySelector('svg');
          if (chevron) chevron.style.transform = open ? '' : 'rotate(180deg)';
          row.style.background = open ? '' : 'rgba(255,255,255,0.03)';
        };
        eventsDiv.appendChild(row);
      });
    }

    renderChatCalEvents2(todayKey);

    requestAnimationFrame(() => {
      if (kaiMsg) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = kaiMsg.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
      }
      setTimeout(() => {
        cardsWrap.style.opacity = '';
        cardsWrap.style.transform = '';
      }, 120);
    });
  }
  function addCompanyCardsToChat(kaiMsg) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    const source = document.querySelector('#overlay-companies .overlay-scroll');
    if (!source) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai'; wrapper.dataset.type = 'companies';
    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:16px;width:100%;margin-top:4px;';
    const time = document.createElement('div');
    time.className = 'chat-time'; time.textContent = 'Now';

    const cards = Array.from(source.querySelectorAll('.company-card'));
    const cloned = cards.map(card => {
      const c = card.cloneNode(true);
      c.style.opacity = '0';
      c.style.transform = 'translateY(10px)';
      c.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
      return c;
    });
    cloned.forEach(c => cardsWrap.appendChild(c));
    // Collapse bar
    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.setAttribute('data-kicker', 'Your Companies');
    sectionBar.setAttribute('data-desc', 'One command view for every brand you operate. Kai keeps each company separated, organized, and moving without mixing the work.');
    sectionBar.setAttribute('data-pills', '● 4 live|11 agents|5 active workflows');
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.innerHTML = '<span class="chat-section-bar-title">Companies</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

    // Wrap cardsWrap in collapsible body
    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);

    wrapper.appendChild(sectionBar);
    wrapper.appendChild(sectionBody);
    wrapper.appendChild(time);
    messages.appendChild(wrapper);

    requestAnimationFrame(() => {
      if (kaiMsg) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = kaiMsg.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
      }
    });

    cloned.forEach((card, i) => {
      setTimeout(() => {
        card.style.opacity = '';
        card.style.transform = '';
      }, 120 + i * 100);
    });
  }
  function goBackToAgent() {
    if (!lastOpenedAgent) {
      openOverlay('overlay-agents');
      return;
    }
    openOverlay('overlay-agents');
    setTimeout(() => {
      const card = lastOpenedAgent.card;
      if (!card) return;
      // Make sure it's open
      if (!card.classList.contains('open')) card.classList.add('open');
      // Scroll to it
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }

  function buildBackButton(agentName) {
    const label = agentName || 'AI Agents';
    return `<div onclick="goBackToAgent()" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px 6px 8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:20px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;margin-bottom:12px;" onmousedown="this.style.opacity='0.6'" onmouseup="this.style.opacity='1'"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>${label}</div>`;
  }

  function handleActivityTap(action, label) {
    const a = action.toLowerCase();
    // Extract name from action if present
    const nameMatch = action.match(/from\s+(.+)|to\s+(.+)/i);
    const name = nameMatch ? (nameMatch[1] || nameMatch[2]).trim() : 'Contact';

    if (a.includes('call transcript') || a.includes('transcript from')) {
      addCallTranscriptToChat(null, name);
    } else if (a.includes('sms to')) {
      addSMSThreadToChat(null, name);
    } else if (a.includes('email to')) {
      addEmailToChat(null, name);
    } else if (a.includes('invoice details') || a.includes('invoice')) {
      addInvoiceDetailToChat(null);
    } else if (a.includes('payment receipt') || a.includes('revenue details')) {
      addPaymentReceiptToChat(null);
    } else if (a.includes('bookkeeping') || a.includes('xero')) {
      addBookkeepingSummaryToChat(null);
    } else if (a.includes('flagged message')) {
      addFlaggedMessageToChat(null);
    } else if (a.includes('approvals')) {
      addApprovalCardsToChat(null);
    } else {
      // Default — fire as chat intent
      sendChatWithIntent(action);
    }
  }

  function openContentRecord(title, html, meta) {
    document.getElementById('content-record-title').textContent = title;
    document.getElementById('content-record-body').innerHTML = html;
    const metaEl = document.getElementById('content-record-meta');
    if (meta && metaEl) {
      metaEl.style.display = 'flex';
      metaEl.innerHTML = meta.map(m => `<div style="flex:1;padding:8px 12px;"><div style="font-size:10px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">${m.label}</div><div style="font-size:13px;font-weight:600;color:var(--text-primary);">${m.value}</div></div>`).join('<div style="width:1px;background:rgba(255,255,255,0.07);margin:8px 0;"></div>');
    } else if (metaEl) {
      metaEl.style.display = 'none';
    }
    openOverlay('overlay-content-record');
    // Typewriter effect on message bubbles after overlay opens
    setTimeout(() => {
      const body = document.getElementById('content-record-body');
      if (!body) return;
      // Find all message divs (font-size:14px bubbles)
      const bubbles = body.querySelectorAll('[style*="border-radius:18px"]');
      let delay = 120;
      bubbles.forEach(bubble => {
        bubble.style.opacity = '0';
        const textDiv = bubble.querySelector('[style*="line-height:1"]') || bubble.querySelector('[style*="line-height"]');
        if (!textDiv) { setTimeout(() => { bubble.style.opacity = '1'; }, delay); delay += 80; return; }
        const originalText = textDiv.textContent;
        textDiv.textContent = '';
        bubble.style.transition = 'opacity 0.15s ease';
        setTimeout(() => {
          bubble.style.opacity = '1';
          let idx = 0;
          function typeNext() {
            if (idx <= originalText.length) {
              textDiv.textContent = originalText.slice(0, idx);
              idx++;
              setTimeout(typeNext, 6);
            }
          }
          typeNext();
        }, delay);
        delay += Math.min(originalText.length * 6 + 200, 800);
      });
    }, 350);
  }

  function addSMSThreadToChat(kaiMsg, name) {
    openContentRecord('SMS Thread',
      `<div style="display:flex;flex-direction:column;gap:16px;">
        <div><div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);margin-bottom:6px;">KAI</div><div style="max-width:82%;background:rgba(255,255,255,0.1);border-radius:18px 18px 18px 4px;padding:12px 16px;"><div style="font-size:14px;color:var(--text-primary);line-height:1.6;">Hi ${name ? name.split(' ')[0] : 'there'}, this is Kai from DKR Consulting. Tony wanted to personally follow up. He is available today at 2 PM — does that work for you?</div><div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:6px;">6:45 AM</div></div></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;"><div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);margin-bottom:6px;text-align:right;">${name ? name.toUpperCase() : 'CONTACT'}</div><div style="max-width:82%;background:rgba(255,255,255,0.06);border-radius:18px 18px 4px 18px;padding:12px 16px;"><div style="font-size:14px;color:var(--text-primary);line-height:1.6;">Thank you. Really appreciate the quick response.</div><div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:6px;text-align:right;">6:52 AM</div></div></div>
        <div><div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);margin-bottom:6px;">KAI</div><div style="max-width:82%;background:rgba(255,255,255,0.1);border-radius:18px 18px 18px 4px;padding:12px 16px;"><div style="font-size:14px;color:var(--text-primary);line-height:1.6;">Absolutely. Is there a preferred time for the follow-up call today?</div><div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:6px;">6:53 AM</div></div></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;"><div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);margin-bottom:6px;text-align:right;">${name ? name.toUpperCase() : 'CONTACT'}</div><div style="max-width:82%;background:rgba(255,255,255,0.06);border-radius:18px 18px 4px 18px;padding:12px 16px;"><div style="font-size:14px;color:var(--text-primary);line-height:1.6;">Anytime after 10 AM works for me.</div><div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:6px;text-align:right;">7:01 AM</div></div></div>
      </div>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:8px;flex-wrap:wrap;">
        <div onclick="sendChatWithIntent('Show me the lead for ${name || 'contact'}')" style="padding:8px 16px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:10px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View Lead</div>
        <div style="padding:8px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;font-size:11px;color:var(--text-tertiary);">Twilio · Live when wired</div>
      </div>`,
      [{label:'Contact',value:name||'Contact'},{label:'Date',value:'Today, 6:45 AM'},{label:'Messages',value:'4'}]
    );
  }

  function addEmailToChat(kaiMsg, name) {
    openContentRecord('Email Thread',
      `<div style="display:flex;flex-direction:column;gap:16px;">
        <div><div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);margin-bottom:6px;">KAI · DKR CONSULTING</div><div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:10px 14px;margin-bottom:8px;"><div style="font-size:13px;color:rgba(255,255,255,0.5);">Subject: Introduction — DKR Consulting &amp; Healthcare Solutions</div></div><div style="max-width:88%;background:rgba(255,255,255,0.1);border-radius:18px 18px 18px 4px;padding:14px 16px;"><div style="font-size:14px;color:var(--text-primary);line-height:1.7;">Hi ${name ? name.split(' ')[0] : 'there'}, I hope this message finds you well. My name is Kai and I am reaching out on behalf of DKR Consulting. We specialize in healthcare operations consulting and veteran support services in the Houston area. Would you be open to a quick call this week?</div><div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:8px;">May 16, 9:00 AM</div></div></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;"><div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);margin-bottom:6px;text-align:right;">${name ? name.toUpperCase() : 'CONTACT'}</div><div style="max-width:88%;background:rgba(255,255,255,0.06);border-radius:18px 18px 4px 18px;padding:14px 16px;"><div style="font-size:14px;color:var(--text-primary);line-height:1.7;">Hi, yes I am definitely interested in learning more about your consulting services. I am generally free in the mornings.</div><div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:8px;text-align:right;">Yesterday, 3:42 PM</div></div></div>
      </div>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:8px;flex-wrap:wrap;">
        <div onclick="sendChatWithIntent('Show me the lead for ${name || 'contact'}')" style="padding:8px 16px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:10px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View Lead</div>
        <div style="padding:8px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;font-size:11px;color:var(--text-tertiary);">Gmail · Live when wired</div>
      </div>`,
      [{label:'Contact',value:name||'Contact'},{label:'Date',value:'Yesterday, 3:42 PM'},{label:'Thread',value:'2 messages'}]
    );
  }

  function addPaymentReceiptToChat(kaiMsg) {
    openContentRecord('Payment Receipt',
      `<div style="margin-bottom:20px;"><div style="font-size:36px;font-weight:700;color:var(--text-primary);">$1,500.00</div><div style="display:inline-flex;margin-top:8px;padding:4px 12px;background:rgba(52,199,89,0.15);border:1px solid rgba(52,199,89,0.3);border-radius:20px;font-size:13px;font-weight:600;color:#34C759;">Paid</div></div>
      <div style="display:flex;flex-direction:column;gap:14px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.07);">
        <div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:var(--text-tertiary);">From</span><span style="font-size:13px;color:var(--text-primary);">DKR Consulting client</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:var(--text-tertiary);">Date</span><span style="font-size:13px;color:var(--text-primary);">May 26, 2026 · 7:58 AM</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:var(--text-tertiary);">Method</span><span style="font-size:13px;color:var(--text-primary);">Visa 4242</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:var(--text-tertiary);">Invoice</span><span style="font-size:13px;color:var(--text-primary);">INV-2026-002</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:var(--text-tertiary);">Transaction ID</span><span style="font-size:13px;color:var(--text-tertiary);">ch_3abc_def</span></div>
      </div>
      <div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap;">
        <div style="padding:8px 16px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:10px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View in Stripe</div>
        <div style="padding:8px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;font-size:11px;color:var(--text-tertiary);">Stripe · Live when wired</div>
      </div>`,
      [{label:'From',value:'DKR Client'},{label:'Date',value:'Today, 7:58 AM'},{label:'Amount',value:'$1,500.00'}]
    );
  }

  function addCallTranscriptToChat(kaiMsg, name) {
    openContentRecord('Inbound Call',
      `<div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:14px 16px;margin-bottom:20px;display:flex;align-items:center;gap:12px;"><div style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;"><svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)"><polygon points="5 3 19 12 5 21 5 3"/></svg></div><div style="flex:1;"><div style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px;"><div style="width:5%;height:100%;background:rgba(255,255,255,0.5);border-radius:2px;"></div></div><div style="display:flex;justify-content:space-between;margin-top:6px;"><span style="font-size:11px;color:rgba(255,255,255,0.4);">0:00</span><span style="font-size:11px;color:rgba(255,255,255,0.4);">3:24</span></div></div></div>
      <div style="display:flex;flex-direction:column;gap:20px;">
        <div><div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);margin-bottom:8px;">KAI</div><div style="max-width:85%;background:rgba(255,255,255,0.1);border-radius:18px 18px 18px 4px;padding:12px 16px;"><div style="font-size:14px;color:var(--text-primary);line-height:1.6;">Thank you for calling DKR Consulting. This is Kai. How can I help you today?</div><div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:6px;">0:00</div></div></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;"><div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);margin-bottom:8px;text-align:right;">${name ? name.toUpperCase() : 'CALLER'}</div><div style="max-width:85%;background:rgba(255,255,255,0.06);border-radius:18px 18px 4px 18px;padding:12px 16px;"><div style="font-size:14px;color:var(--text-primary);line-height:1.6;">Hi yes, my name is ${name || 'Marcus Williams'}. I am a veteran and I was looking for some support services. Someone referred me to you all.</div><div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:6px;text-align:right;">0:06</div></div></div>
        <div><div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);margin-bottom:8px;">KAI</div><div style="max-width:85%;background:rgba(255,255,255,0.1);border-radius:18px 18px 18px 4px;padding:12px 16px;"><div style="font-size:14px;color:var(--text-primary);line-height:1.6;">Hi ${name ? name.split(' ')[0] : 'there'}, thank you for calling and for your service. We would love to help. Can I get your phone number so we can follow up with you directly?</div><div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:6px;">0:18</div></div></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;"><div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);margin-bottom:8px;text-align:right;">${name ? name.toUpperCase() : 'CALLER'}</div><div style="max-width:85%;background:rgba(255,255,255,0.06);border-radius:18px 18px 4px 18px;padding:12px 16px;"><div style="font-size:14px;color:var(--text-primary);line-height:1.6;">Sure, it is (713) 555-0182.</div><div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:6px;text-align:right;">0:28</div></div></div>
      </div>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:8px;flex-wrap:wrap;">
        <div onclick="sendChatWithIntent('Show me the lead for ${name || 'contact'}')" style="padding:8px 16px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:10px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View Lead</div>
        <div style="padding:8px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;font-size:11px;color:var(--text-tertiary);">Twilio · Live when wired</div>
      </div>`,
      [{label:'Agent',value:'Inbound Agent'},{label:'Date',value:'Today, 6:42 AM'},{label:'Duration',value:'3m 24s'}]
    );
  }

  function addInvoiceDetailToChat(kaiMsg) {
    openContentRecord('Invoice',
      `<div style="margin-bottom:20px;"><div style="font-size:36px;font-weight:700;color:var(--text-primary);">$8,500.00</div><div style="font-size:13px;color:var(--text-tertiary);margin-top:4px;">INV-2026-004</div><div style="display:inline-flex;margin-top:8px;padding:4px 12px;background:rgba(255,149,0,0.15);border:1px solid rgba(255,149,0,0.3);border-radius:20px;font-size:13px;font-weight:600;color:#FF9500;">Unpaid</div></div>
      <div style="display:flex;flex-direction:column;gap:14px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.07);">
        <div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:var(--text-tertiary);">To</span><span style="font-size:13px;color:var(--text-primary);">Riverside Medical</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:var(--text-tertiary);">Sent</span><span style="font-size:13px;color:var(--text-primary);">May 26, 2026 8:15 AM</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:var(--text-tertiary);">Due</span><span style="font-size:13px;color:var(--text-primary);">June 2, 2026</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:var(--text-tertiary);">Description</span><span style="font-size:13px;color:var(--text-primary);">$8,500 retainer</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:var(--text-tertiary);">Follow-up</span><span style="font-size:13px;color:var(--text-primary);">Scheduled day 7 if unpaid</span></div>
      </div>
      <div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap;">
        <div style="padding:8px 16px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:10px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View in Stripe</div>
        <div style="padding:8px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;font-size:11px;color:var(--text-tertiary);">Stripe · Live when wired</div>
      </div>`,
      [{label:'To',value:'Riverside Medical'},{label:'Date',value:'May 26, 8:15 AM'},{label:'Status',value:'Unpaid'}]
    );
  }

  function addBookkeepingSummaryToChat(kaiMsg) {
    openContentRecord('Bookkeeping Summary',
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
        <div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:14px;"><div style="font-size:10px;font-weight:600;letter-spacing:.06em;color:var(--text-tertiary);margin-bottom:6px;">TOTAL INCOME</div><div style="font-size:22px;font-weight:700;color:#34C759;">$14,200</div></div>
        <div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:14px;"><div style="font-size:10px;font-weight:600;letter-spacing:.06em;color:var(--text-tertiary);margin-bottom:6px;">TOTAL EXPENSES</div><div style="font-size:22px;font-weight:700;color:#FF453A;">$3,840</div></div>
        <div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:14px;"><div style="font-size:10px;font-weight:600;letter-spacing:.06em;color:var(--text-tertiary);margin-bottom:6px;">OUTSTANDING</div><div style="font-size:22px;font-weight:700;color:#FF9500;">$8,500</div></div>
        <div style="background:rgba(255,255,255,0.05);border-radius:14px;padding:14px;"><div style="font-size:10px;font-weight:600;letter-spacing:.06em;color:var(--text-tertiary);margin-bottom:6px;">UNCATEGORIZED</div><div style="font-size:22px;font-weight:700;color:#FF9500;">3</div></div>
      </div>
      <div style="padding-top:16px;border-top:1px solid rgba(255,255,255,0.07);">
        <div style="font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:12px;">Flagged Items</div>
        <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;color:var(--text-secondary);line-height:1.7;">
          <div style="display:flex;gap:10px;"><span>⚠️</span><span>3 uncategorized expenses need review</span></div>
          <div style="display:flex;gap:10px;"><span>🧾</span><span>Riverside Medical invoice ($8,500) outstanding</span></div>
          <div style="display:flex;gap:10px;"><span>✅</span><span>All invoices synced to Xero</span></div>
        </div>
      </div>
      <div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap;">
        <div style="padding:8px 16px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:10px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View in Xero</div>
        <div style="padding:8px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;font-size:11px;color:var(--text-tertiary);">Xero · Live when wired</div>
      </div>`,
      [{label:'Agent',value:'Xero Bookkeeping'},{label:'Date',value:'Yesterday, 6:00 PM'},{label:'Status',value:'3 flagged'}]
    );
  }

  function addFlaggedMessageToChat(kaiMsg) {
    openContentRecord('Flagged Message',
      `<div style="background:rgba(255,69,58,0.08);border:1px solid rgba(255,69,58,0.2);border-radius:14px;padding:16px;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:600;color:#FF453A;margin-bottom:8px;">FLAGGED BY OPERATIONS SUPERVISOR</div>
        <div style="font-size:14px;color:var(--text-primary);line-height:1.7;font-style:italic;">"As discussed we guarantee full refund within 30 days if the retainer does not deliver results."</div>
      </div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.7;margin-bottom:20px;">This message contains a financial guarantee. The Supervisor has held it pending your approval before it is sent to Riverside Medical.</div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:var(--text-tertiary);">Drafted by</span><span style="font-size:13px;color:var(--text-primary);">Collections Agent</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:var(--text-tertiary);">Flagged by</span><span style="font-size:13px;color:var(--text-primary);">Operations Supervisor</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:var(--text-tertiary);">Recipient</span><span style="font-size:13px;color:var(--text-primary);">Riverside Medical</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="font-size:13px;color:var(--text-tertiary);">Reason</span><span style="font-size:13px;color:#FF453A;">Financial guarantee</span></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <div onclick="closeOverlay('overlay-content-record')" style="padding:8px 20px;background:rgba(52,199,89,0.15);border:1px solid rgba(52,199,89,0.3);border-radius:10px;font-size:13px;font-weight:600;color:#34C759;cursor:pointer;">Approve &amp; Send</div>
        <div onclick="closeOverlay('overlay-content-record')" style="padding:8px 20px;background:rgba(255,69,58,0.12);border:1px solid rgba(255,69,58,0.25);border-radius:10px;font-size:13px;font-weight:600;color:#FF453A;cursor:pointer;">Reject</div>
      </div>`,
      [{label:'Agent',value:'Collections Agent'},{label:'Date',value:'Today, 8:42 AM'},{label:'Status',value:'Flagged'}]
    );
  }

  function addMorningBriefingToChat(kaiMsg) {
    openContentRecord('Morning Briefing',
      `<div style="display:flex;flex-direction:column;gap:16px;">
        <div style="background:rgba(255,255,255,0.04);border-radius:14px;padding:14px 16px;"><div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:8px;">Overnight Activity</div><div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">2 calls answered. 1 invoice sent. 3 new leads responded to. 1 message flagged by the Supervisor.</div></div>
        <div style="background:rgba(255,255,255,0.04);border-radius:14px;padding:14px 16px;"><div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:8px;">Priority Today</div><div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">Strategy call with Marcus Williams at 2PM. Proposal due to Riverside Medical by EOD. Follow-up draft for Sandra Lee awaiting your approval.</div></div>
        <div style="background:rgba(255,255,255,0.04);border-radius:14px;padding:14px 16px;"><div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:8px;">Revenue</div><div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">$3,200 in payments received yesterday. $8,500 invoice outstanding — Riverside Medical day 0.</div></div>
        <div style="background:rgba(255,255,255,0.04);border-radius:14px;padding:14px 16px;"><div style="font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:8px;">Agent Status</div><div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">All 12 agents active. Operations Supervisor in Gatekeeper Mode. No failed workflows overnight.</div></div>
      </div>`,
      [{label:'Generated by',value:'Kai'},{label:'Date',value:'Today, 7:00 AM'},{label:'Companies',value:'All'}]
    );
  }

  function addContactsToChat(kaiMsg, companyFilter) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    const allContacts = [
      { name: 'Marcus Williams', role: 'VP of Operations', company: 'DKR Consulting', tag: 'Hot Lead', phone: '(713) 555-0182', email: 'm.williams@helixhealth.com' },
      { name: 'Sandra Lee', role: 'Healthcare Consulting Inquiry', company: 'DKR Consulting', tag: 'New Lead', phone: '(832) 555-0241', email: 'sandra.lee@rivmed.com' },
      { name: 'James Porter', role: 'Web Inquiry', company: 'DKR Consulting', tag: 'New Lead', phone: '', email: '' },
      { name: 'Riverside Medical', role: 'Client — $8,500 retainer', company: 'DKR Consulting', tag: 'Client', phone: '(713) 555-0100', email: 'billing@riversidemedical.com' },
      { name: 'David Okafor', role: 'Inactive — 94 days', company: 'DKR Consulting', tag: 'Inactive', phone: '', email: '' },
      { name: 'Lance', role: 'Active Buyer — Westin Homes', company: 'Twizted Vybz Realty', tag: 'Hot Lead', phone: '', email: '' },
      { name: 'David Chen', role: 'Property Inquiry', company: 'Twizted Vybz Realty', tag: 'New Lead', phone: '', email: '' },
    ];

    // Filter by company if specified
    const filtered = companyFilter
      ? allContacts.filter(c => c.company.toLowerCase().includes(companyFilter.toLowerCase()))
      : allContacts;

    // Group by company
    const grouped = {};
    filtered.forEach(c => {
      if (!grouped[c.company]) grouped[c.company] = [];
      grouped[c.company].push(c);
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai';

    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.innerHTML = `<span class="chat-section-bar-title">${companyFilter ? companyFilter + ' Contacts' : 'All Contacts'}</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>`;

    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:16px;width:100%;margin-top:4px;';

    const allItems = [];

    Object.entries(grouped).forEach(([company, contacts]) => {
      // Company label
      const label = document.createElement('div');
      label.style.cssText = 'font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);padding:4px 0 0;opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';
      label.textContent = company;
      cardsWrap.appendChild(label);
      allItems.push(label);

      contacts.forEach(contact => {
        const card = document.createElement('div');
        card.className = 'agent-card';
        card.style.cssText = 'opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';
        card.onclick = function() { toggleAgentCard(this); };

        const tagColor = contact.tag === 'Hot Lead' ? '#34C759' : contact.tag === 'Client' ? '#0A84FF' : contact.tag === 'Inactive' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.35)';

        card.innerHTML = `
          <div class="agent-card-top">
            <div class="agent-card-name">${contact.name}</div>
            <div style="padding:2px 8px;border-radius:10px;border:1px solid ${tagColor};font-size:10px;font-weight:600;color:${tagColor};white-space:nowrap;">${contact.tag}</div>
            <svg class="agent-card-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="agent-card-action" style="-webkit-line-clamp:1;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;">${contact.role}</div>
          <div class="agent-card-tap-hint">
            <span class="agent-card-tap-hint-label">Expand</span>
            <span class="agent-card-tap-hint-time">${contact.company}</span>
          </div>
          <div class="agent-card-body">
            <div class="agent-card-action" style="margin-bottom:10px;">${contact.role}</div>
            ${contact.phone ? `<div class="agent-card-time" style="margin-bottom:4px;">📞 ${contact.phone}</div>` : ''}
            ${contact.email ? `<div class="agent-card-time" style="margin-bottom:10px;">✉️ ${contact.email}</div>` : ''}
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <div onclick="event.stopPropagation();sendChatWithIntent('Show me the lead for ${contact.name}')" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View Lead</div>
              ${contact.phone ? `<div onclick="event.stopPropagation();sendChatWithIntent('Call ${contact.name}')" style="padding:6px 14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">Call</div>` : ''}
            </div>
          </div>`;
        cardsWrap.appendChild(card);
        allItems.push(card);
      });
    });

    if (filtered.length === 0) {
      cardsWrap.innerHTML = `<div style="padding:16px;font-size:13px;color:var(--text-secondary);">No contacts found for "${companyFilter}".</div>`;
    }

    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);
    const time = document.createElement('div');
    time.className = 'chat-time'; time.textContent = 'Now';

    wrapper.appendChild(sectionBar); wrapper.appendChild(sectionBody); wrapper.appendChild(time);
    messages.appendChild(wrapper);

    requestAnimationFrame(() => {
      if (kaiMsg) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = kaiMsg.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
      }
    });

    allItems.forEach((el, i) => {
      setTimeout(() => { el.style.opacity = ''; el.style.transform = ''; }, 120 + i * 60);
    });
  }

  function addCallSummaryToChat(kaiMsg) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai'; wrapper.dataset.type = 'calls';

    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.innerHTML = '<span class="chat-section-bar-title">Call Activity</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:16px;width:100%;margin-top:4px;';

    const callItems = [
      { agent: 'Inbound Agent', title: 'Call answered — Marcus Williams', body: 'Inbound Agent answered a call from Marcus Williams. Qualified the lead, answered 3 questions, and booked a callback for 2PM.', time: '9:04 AM · DKR Consulting', status: 'active' },
      { agent: 'Speed to Lead', title: 'Outbound call — Sandra Lee', body: 'Speed to Lead Agent called Sandra Lee 42 seconds after her form submission. Left a voicemail and sent a follow-up text.', time: '8:51 AM · DKR Consulting', status: 'active' },
      { agent: 'Inbound Agent', title: 'Call answered — David Chen', body: 'Inbound Agent answered a property inquiry from David Chen. Sent listing details and booked a walkthrough for tomorrow 11AM.', time: 'Yesterday 2:30 PM · Twizted Vybz Realty', status: '' },
    ];

    callItems.forEach(n => {
      const card = document.createElement('div');
      card.className = 'agent-card';
      card.style.cssText = 'opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';
      card.onclick = function() { toggleAgentCard(this); };
      card.innerHTML = `
        <div class="agent-card-top">
          <div class="agent-card-name">${n.title}</div>
          <div class="agent-status ${n.status}"><div class="agent-status-dot"></div>${n.status === 'active' ? 'Today' : ''}</div>
          <svg class="agent-card-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="agent-card-action" style="-webkit-line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;">${n.body}</div>
        <div class="agent-card-tap-hint">
          <span class="agent-card-tap-hint-label">Expand</span>
          <span class="agent-card-tap-hint-time">${n.time}</span>
        </div>
        <div class="agent-card-body">
          <div class="agent-card-action">${n.body}</div>
          <div class="agent-card-time" style="margin-top:6px;margin-bottom:8px;">${n.time} · ${n.agent}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <div onclick="event.stopPropagation();sendChatWithIntent('Show me the lead for ${n.title.split('—')[1]?.trim() || 'this contact'}')" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View Lead</div>
            <div onclick="event.stopPropagation();" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">Transcript</div>
            <div onclick="event.stopPropagation();" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">▶ Listen</div>
          </div>
        </div>`;
      cardsWrap.appendChild(card);
    });

    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);
    const time = document.createElement('div');
    time.className = 'chat-time'; time.textContent = 'Now';
    wrapper.appendChild(sectionBar);
    wrapper.appendChild(sectionBody);
    wrapper.appendChild(time);
    messages.appendChild(wrapper);

    requestAnimationFrame(() => {
      if (kaiMsg) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = kaiMsg.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
      }
    });
    Array.from(cardsWrap.children).forEach((el, i) => {
      setTimeout(() => { el.style.opacity = ''; el.style.transform = ''; }, 120 + i * 80);
    });
  }

  function addFinancialSummaryToChat(kaiMsg) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai'; wrapper.dataset.type = 'financials';

    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.innerHTML = '<span class="chat-section-bar-title">Financial Activity</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

    const cardsWrap = document.createElement('div');
    cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:16px;width:100%;margin-top:4px;';

    const finItems = [
      { agent: 'Invoice & Billing Agent', title: 'Invoice sent — Riverside Medical', body: 'Invoice INV-2026-004 sent for $8,500. Follow-up scheduled for day 7 if unpaid.', time: '8:15 AM · DKR Consulting', color: 'rgba(255,255,255,0.35)',
        actions: `<div onclick="event.stopPropagation();" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View Invoice</div><div onclick="event.stopPropagation();" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View in Stripe</div>` },
      { agent: 'Stripe Revenue Agent', title: 'Payment received — $1,500', body: '3 payments processed today. Total revenue: $3,200 across all companies. No failed charges.', time: '7:58 AM · All Companies', color: 'rgba(255,255,255,0.35)',
        actions: `<div onclick="event.stopPropagation();sendChatWithIntent('Show me my business health')" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View Revenue</div>` },
      { agent: 'Operations Supervisor', title: 'Flagged — Collections Agent', body: 'Collections Agent drafted a payment guarantee to Riverside Medical. Message held — awaiting your approval.', time: '8:42 AM · DKR Consulting', color: 'rgba(255,255,255,0.35)',
        actions: `<div onclick="event.stopPropagation();" style="padding:5px 12px;background:rgba(52,199,89,0.15);border:1px solid rgba(52,199,89,0.3);border-radius:8px;font-size:13px;font-weight:600;color:#34C759;cursor:pointer;">Approve</div><div onclick="event.stopPropagation();" style="padding:5px 12px;background:rgba(255,69,58,0.12);border:1px solid rgba(255,69,58,0.25);border-radius:8px;font-size:13px;font-weight:600;color:#FF453A;cursor:pointer;">Reject</div>` },
      { agent: 'Xero Bookkeeping Agent', title: 'Monthly summary ready', body: '3 uncategorized expenses flagged. All invoices synced to Xero. Bookkeeping summary ready to review.', time: 'Yesterday · All Companies', color: 'rgba(255,255,255,0.35)',
        actions: `<div onclick="event.stopPropagation();" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View Summary</div><div onclick="event.stopPropagation();" style="padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;font-size:13px;font-weight:600;color:var(--text-secondary);cursor:pointer;">View in Xero</div>` },
    ];

    finItems.forEach(n => {
      const card = document.createElement('div');
      card.className = 'agent-card';
      card.style.cssText = 'opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;';
      card.onclick = function() { toggleAgentCard(this); };
      card.innerHTML = `
        <div class="agent-card-top">
          <div class="agent-card-name">${n.title}</div>
          <div class="agent-status active"><div class="agent-status-dot" style="background:${n.color};"></div></div>
          <svg class="agent-card-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="agent-card-action" style="-webkit-line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;">${n.body}</div>
        <div class="agent-card-tap-hint">
          <span class="agent-card-tap-hint-label">Expand</span>
          <span class="agent-card-tap-hint-time">${n.time}</span>
        </div>
        <div class="agent-card-body">
          <div class="agent-card-action">${n.body}</div>
          <div class="agent-card-time" style="margin-top:6px;margin-bottom:8px;">${n.time} · ${n.agent}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">${n.actions}</div>
        </div>`;
      cardsWrap.appendChild(card);
    });

    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';
    sectionBody.appendChild(cardsWrap);
    const time = document.createElement('div');
    time.className = 'chat-time'; time.textContent = 'Now';
    wrapper.appendChild(sectionBar);
    wrapper.appendChild(sectionBody);
    wrapper.appendChild(time);
    messages.appendChild(wrapper);

    requestAnimationFrame(() => {
      if (kaiMsg) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = kaiMsg.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
      }
    });
    Array.from(cardsWrap.children).forEach((el, i) => {
      setTimeout(() => { el.style.opacity = ''; el.style.transform = ''; }, 120 + i * 80);
    });
  }

  function addHealthCardsToChat(kaiMsg) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg acai'; wrapper.dataset.type = 'reports';
    wrapper.style.cssText = 'width:calc(100% + 0px);margin-left:0;margin-right:0;box-sizing:border-box;';

    const sectionBar = document.createElement('div');
    sectionBar.className = 'chat-section-bar';
    sectionBar.onclick = function() { toggleChatSection(this); };
    sectionBar.innerHTML = '<span class="chat-section-bar-title">Business Health</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

    const sectionBody = document.createElement('div');
    sectionBody.className = 'chat-section-body';

    const dash = document.createElement('div');
    dash.style.cssText = 'width:100%;padding:0 4px;opacity:0;transform:translateY(10px);transition:opacity 0.3s ease,transform 0.3s ease;box-sizing:border-box;';
    dash.innerHTML = `
      <div style="padding:4px 0 16px;">

        <!-- Today summary -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px;">
          <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px 12px;">
            <div style="font-size:10px;font-weight:600;letter-spacing:.06em;color:rgba(255,255,255,0.4);margin-bottom:6px;">GROSS VOL.</div>
            <div style="font-size:20px;font-weight:700;color:#fff;line-height:1;">$3,200</div>
            <div style="font-size:11px;color:#34C759;margin-top:4px;">+18.4%</div>
          </div>
          <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px 12px;">
            <div style="font-size:10px;font-weight:600;letter-spacing:.06em;color:rgba(255,255,255,0.4);margin-bottom:6px;">PAYMENTS</div>
            <div style="font-size:20px;font-weight:700;color:#fff;line-height:1;">3</div>
            <div style="font-size:11px;color:#34C759;margin-top:4px;">+1 today</div>
          </div>
          <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px 12px;">
            <div style="font-size:10px;font-weight:600;letter-spacing:.06em;color:rgba(255,255,255,0.4);margin-bottom:6px;">LEADS</div>
            <div style="font-size:20px;font-weight:700;color:#fff;line-height:1;">3</div>
            <div style="font-size:11px;color:#FF9500;margin-top:4px;">2 active</div>
          </div>
        </div>

        <!-- Time filter tabs -->
        <div style="display:flex;gap:6px;margin-bottom:16px;" id="health-tabs">
          ${['1W','4W','1Y','MTD','QTD','YTD'].map((t,i) => `
            <div onclick="selectHealthTab(this,'${t}')" style="padding:5px 10px;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s;${i===1 ? 'background:#635BFF;color:#fff;' : 'background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.45);'}">${t}</div>
          `).join('')}
        </div>

        <!-- Revenue chart -->
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:16px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
            <div>
              <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:4px;">Gross volume</div>
              <div style="font-size:24px;font-weight:700;color:#fff;">$14.2K</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;">Apr 28 – May 26</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:13px;font-weight:600;color:#34C759;">+21.4%</div>
              <div style="font-size:20px;font-weight:700;color:#34C759;">$17.2K</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;">May – Yesterday</div>
            </div>
          </div>
          <svg viewBox="0 0 300 80" style="width:100%;height:70px;margin-top:8px;" id="health-chart-revenue">
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#635BFF" stop-opacity="0.4"/>
                <stop offset="100%" stop-color="#635BFF" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0,60 L15,55 L30,50 L45,30 L60,45 L75,40 L90,55 L105,35 L120,45 L135,50 L150,30 L165,25 L180,40 L195,20 L210,35 L225,15 L240,30 L255,20 L270,25 L285,10 L300,15" fill="none" stroke="#635BFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M0,60 L15,55 L30,50 L45,30 L60,45 L75,40 L90,55 L105,35 L120,45 L135,50 L150,30 L165,25 L180,40 L195,20 L210,35 L225,15 L240,30 L255,20 L270,25 L285,10 L300,15 L300,80 L0,80 Z" fill="url(#revGrad)"/>
          </svg>
        </div>

        <!-- Payments chart -->
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:16px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
            <div>
              <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:4px;">Successful payments</div>
              <div style="font-size:24px;font-weight:700;color:#fff;">24</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;">Apr 28 – May 26</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:13px;font-weight:600;color:#34C759;">+10.2%</div>
              <div style="font-size:20px;font-weight:700;color:#34C759;">31</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;">May – Yesterday</div>
            </div>
          </div>
          <svg viewBox="0 0 300 80" style="width:100%;height:70px;margin-top:8px;">
            <defs>
              <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#34C759" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#34C759" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0,50 L15,45 L30,55 L45,40 L60,50 L75,35 L90,45 L105,30 L120,40 L135,45 L150,25 L165,35 L180,30 L195,20 L210,35 L225,25 L240,30 L255,15 L270,25 L285,20 L300,10" fill="none" stroke="#34C759" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M0,50 L15,45 L30,55 L45,40 L60,50 L75,35 L90,45 L105,30 L120,40 L135,45 L150,25 L165,35 L180,30 L195,20 L210,35 L225,25 L240,30 L255,15 L270,25 L285,20 L300,10 L300,80 L0,80 Z" fill="url(#payGrad)"/>
          </svg>
        </div>

        <!-- Lead conversion -->
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:16px;">
          <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:12px;">Lead conversion</div>
          <div style="display:flex;gap:10px;">
            <div style="flex:1;text-align:center;">
              <div style="font-size:22px;font-weight:700;color:#fff;">18</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:3px;">NEW LEADS</div>
            </div>
            <div style="flex:1;text-align:center;">
              <div style="font-size:22px;font-weight:700;color:#FF9500;">4</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:3px;">DEALS CLOSED</div>
            </div>
            <div style="flex:1;text-align:center;">
              <div style="font-size:22px;font-weight:700;color:#34C759;">22%</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:3px;">CONV. RATE</div>
            </div>
            <div style="flex:1;text-align:center;">
              <div style="font-size:22px;font-weight:700;color:#FF453A;">3</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:3px;">FOLLOW-UPS</div>
            </div>
          </div>
        </div>

      </div>`;

    sectionBody.appendChild(dash);
    wrapper.appendChild(sectionBar);
    wrapper.appendChild(sectionBody);
    const time = document.createElement('div');
    time.className = 'chat-time'; time.textContent = 'Now';
    wrapper.appendChild(time);
    messages.appendChild(wrapper);

    requestAnimationFrame(() => {
      if (kaiMsg) {
        const msgsRect = messages.getBoundingClientRect();
        const msgRect = kaiMsg.getBoundingClientRect();
        messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
      }
    });

    setTimeout(() => { dash.style.opacity = ''; dash.style.transform = ''; }, 120);
  }

  function selectHealthTab(el, tab) {
    el.closest('#health-tabs').querySelectorAll('div').forEach(t => {
      t.style.background = 'rgba(255,255,255,0.06)';
      t.style.color = 'rgba(255,255,255,0.45)';
    });
    el.style.background = '#635BFF';
    el.style.color = '#fff';
  }

  function buildChatCalWeekStrip() {
    const strip = document.getElementById('cal-week-strip-chat');
    if (!strip) return;
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    strip.innerHTML = '';
    let todayKey = '';
    for (let i = -1; i <= 6; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const dateKey = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      if (i === 0) todayKey = dateKey;
      const pill = document.createElement('div');
      pill.className = 'cal-day-pill' + (i === 0 ? ' today selected' : '');
      pill.dataset.date = dateKey;
      pill.innerHTML = `<div class="cal-day-name">${days[d.getDay()]}</div><div class="cal-day-num">${d.getDate()}</div><div class="cal-day-dot" style="${calEvents[dateKey] ? '' : 'background:transparent;'}"></div>`;
      pill.onclick = () => {
        document.querySelectorAll('#cal-week-strip-chat .cal-day-pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        renderChatCalEvents(dateKey);
      };
      strip.appendChild(pill);
    }
    renderChatCalEvents(todayKey);
  }

  function renderChatCalEvents(dateKey) {
    const container = document.getElementById('cal-events-container-chat');
    if (!container) return;
    const events = calEvents[dateKey] || [];
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const todayKey = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
    const d = new Date(dateKey);
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const label = dateKey === todayKey ? 'Today' : `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;
    if (events.length === 0) {
      container.innerHTML = `<div class="cal-day-label" style="padding:12px 18px 6px;">${label}</div><div class="cal-empty" style="padding:4px 18px 16px;">Nothing scheduled. Ask Kai to add something.</div>`;
      return;
    }
    container.innerHTML = `<div class="cal-day-label" style="padding:12px 18px 6px;">${label}</div>` +
      events.map(ev => `
        <div class="cal-event" onclick="sendChatWithIntent('Tell me about: ${ev.title.replace(/'/g,"\'")}')">
          <div class="cal-event-time-col"><div class="cal-event-time">${ev.time}</div>${ev.duration ? `<div class="cal-event-duration">${ev.duration}</div>` : ''}</div>
          <div class="cal-event-bar ${ev.bar}"></div>
          <div class="cal-event-info"><div class="cal-event-title">${ev.title}</div><div class="cal-event-meta">${ev.meta}</div><div class="cal-event-tag">${ev.tag}</div></div>
        </div>`).join('') + '<div style="height:12px;"></div>';
  }

  const agentCommandReplies = {
    'all': 'Your agents are already working. Here\'s the full picture.',
    'dkr': 'Here are the agents running for DKR Consulting.',
    'realty': 'Here are the agents running for Twizted Vybz Realty.',
    'capital': 'Here are the Generations Capital agents.',
    'gft': 'Here are the Guilt Free Temptations agents.',
    'streetwear': 'Here are the Streetwear agents.',
    'tvhealthcare': 'Here are the TV Healthcare agents.'
  };

  // ── SEND CHAT MESSAGE ────────────────────────────────────────────────────

  function sendChatMessage() {
    const input = document.getElementById('chat-input-field');
    const text = input ? input.value.trim() : '';
    if (!text) return;
    const userMsg = addChatMsg('user', escapeHtml(text));
    if (input) input.value = '';

    const messages = document.getElementById('chat-messages');

    // Single rAF: user msg scroll is sync, typing indicator appends next frame
    requestAnimationFrame(() => {
      const typing = document.createElement('div');
      typing.className = 'chat-msg acai'; typing.dataset.type = 'kai';
      typing.id = 'typing-indicator';
      typing.innerHTML = '<div class="chat-sender">Kai</div><div class="chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
      messages.appendChild(typing);
      messages.scrollTop = messages.scrollHeight;

      const settingsTexts = ['Show me my profile','Show me my usage','Show me my billing','Show me my connectors','Show me agent controls','Show me my preferences','Show me legal'];
      const isSettingsChip = settingsTexts.includes(text);
      const agentCmd = isSettingsChip ? null : detectAgentCommand(text);
      const intent = detectIntent(text);

      setTimeout(() => {
        document.getElementById('typing-indicator')?.remove();

        // ── Named text-based intents ────────────────────────────────
        const tl = text.toLowerCase();

        // Call transcript — fires transcript card with Twilio stub
        if (tl.includes('call transcript from') || tl.includes('transcript from')) {
          const nameMatch = text.match(/(?:call transcript from|transcript from)\s+(.+)/i);
          const name = nameMatch ? nameMatch[1].trim() : 'this contact';
          const kaiMsg = addChatMsg('acai', `Here is the call transcript from ${name}.`);
          addCallTranscriptToChat(kaiMsg, name);
        } else if (tl.includes('show me the sms to') || tl.includes('sms to')) {
          const nameMatch = text.match(/(?:show me the sms to|sms to)\s+(.+)/i);
          const name = nameMatch ? nameMatch[1].trim() : 'this contact';
          const kaiMsg = addChatMsg('acai', `Here is the SMS thread with ${name}.`);
          addSMSThreadToChat(kaiMsg, name);
        } else if (tl.includes('show me the email to') || tl.includes('email to')) {
          const nameMatch = text.match(/(?:show me the email to|email to)\s+(.+)/i);
          const name = nameMatch ? nameMatch[1].trim() : 'this contact';
          const kaiMsg = addChatMsg('acai', `Here is the email sent to ${name}.`);
          addEmailToChat(kaiMsg, name);
        } else if (tl.includes('show me the payment receipt') || tl.includes('payment receipt')) {
          const kaiMsg = addChatMsg('acai', 'Here is the payment receipt.');
          addPaymentReceiptToChat(kaiMsg);
        } else if (tl.includes('show me the invoice details') || tl.includes('invoice details')) {
          const kaiMsg = addChatMsg('acai', 'Here is the invoice detail.');
          addInvoiceDetailToChat(kaiMsg);
        } else if (tl.includes('contacts for') || tl.includes('show me contacts')) {
          const companyMatch = text.match(/contacts for\s+(.+)/i);
          const company = companyMatch ? companyMatch[1].trim() : null;
          const kaiMsg = addChatMsg('acai', company ? `Here are the contacts for ${company}.` : 'Here are your contacts across all companies.');
          addContactsToChat(kaiMsg, company);
        } else if (tl.includes('show me hot leads') || tl.includes('hot leads')) {
          const kaiMsg = addChatMsg('acai', 'Your hottest leads are right here. These need attention first.');
          addLeadCardsToChat(kaiMsg, 'hot');
        } else if (tl.includes('show me new leads') || tl.includes('new leads today') || tl.includes('new leads')) {
          const kaiMsg = addChatMsg('acai', 'Fresh leads from today. Your agents captured every one.');
          addLeadCardsToChat(kaiMsg, 'new');
        } else if (tl.includes('leads for dkr') || tl.includes('dkr leads')) {
          const kaiMsg = addChatMsg('acai', 'Here are your DKR Consulting leads. Pipeline is active.');
          addLeadCardsToChat(kaiMsg, 'dkr');
        } else if (tl.includes('leads for realty') || tl.includes('realty leads')) {
          const kaiMsg = addChatMsg('acai', 'Here are your Realty leads. Pipeline is active.');
          addLeadCardsToChat(kaiMsg, 'realty');
        } else if (tl.includes('flagged message') || tl.includes('show me the flagged')) {
          const kaiMsg = addChatMsg('acai', 'The Supervisor flagged this before it went out. It needs your call.');
          addFlaggedMessageToChat(kaiMsg);
        } else if (tl.includes('show me my notifications') || tl === 'notifications') {
          const hour = new Date().getHours();
          const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
          const kaiMsg = addChatMsg('acai', `Good ${timeOfDay} Tony. 5 things happened while you were out. Check it below.`);
          addNotificationsToChat(kaiMsg);
        } else if (tl.includes('what is acaios') || tl.includes('about acaios') || tl.includes('what is kai') || tl.includes('what does acaios do')) {
          openEduChat('about');
        } else if (tl === 'help' || tl === 'i need help' || tl.includes('how do i') || tl.includes('how does') && tl.includes('work')) {
          const kaiMsg = addChatMsg('acai', 'Here is everything Kai can do for you. Tap anything to get started.');
          addHelpCardToChat(kaiMsg);
        } else if (tl.includes('connectors') || tl.includes('show me my connectors') || tl.includes('my integrations')) {
          const kaiMsg = addChatMsg('acai', 'Here are your connected services. Everything Kai is plugged into.');
          addSettingsCardToChat('connectors', kaiMsg);
        } else if (tl.includes('morning briefing') || tl.includes('my briefing')) {
          const kaiMsg = addChatMsg('acai', 'Your morning briefing is ready. Kai has been working since midnight.');
          addMorningBriefingToChat(kaiMsg);
        } else if (tl.includes('bookkeeping summary') || tl.includes('xero summary')) {
          const kaiMsg = addChatMsg('acai', 'Your books are up to date. Here is the latest from Xero.');
          addBookkeepingSummaryToChat(kaiMsg);
        } else if (tl.includes('revenue details') || tl.includes('show me my revenue')) {
          const kaiMsg = addChatMsg('acai', "Here is your financial activity. Invoices, payments, and bookkeeping — all in one place.");
          addFinancialSummaryToChat(kaiMsg);
        } else if (tl.includes('upgrade my plan') || tl.includes('upgrade plan')) {
          const kaiMsg = addChatMsg('acai', 'Here are your plan and billing details. Everything is current.');
          addSettingsCardToChat('billing', kaiMsg);
        } else if (/^tell me about\s+/i.test(text)) {
          const name = text.replace(/^tell me about\s+/i, '').trim();
          const kaiMsg = addChatMsg('acai', `Here is what I have on ${name}.`);
          addSingleLeadToChat(kaiMsg, name);
        } else if (agentCmd) {
          const reply = agentCommandReplies[agentCmd] || 'Here are your agents.';
          const kaiMsg = addChatMsg('acai', reply);
          addAgentCardsToChat(agentCmd, kaiMsg);
        } else if (intent === 'calls') {
          const kaiMsg = addChatMsg('acai', "Here's call activity from the agent team today.");
          addCallSummaryToChat(kaiMsg);
        } else if (intent === 'financials') {
          const kaiMsg = addChatMsg('acai', "Here is your financial activity. Invoices, payments, and bookkeeping — all in one place.");
          addFinancialSummaryToChat(kaiMsg);
        } else if (intent === 'leads') {
          // Check for named lead — "Show me the lead for Marcus Williams"
          const namedLeadMatch = text.match(/(?:show me the lead for|lead for|view lead for)\s+(.+)/i);
          if (namedLeadMatch) {
            const name = namedLeadMatch[1].trim();
            const kaiMsg = addChatMsg('acai', `Here is the lead for ${name}.`);
            addSingleLeadToChat(kaiMsg, name);
          } else {
            const kaiMsg = addChatMsg('acai', 'Your leads are live. Here is every one your agents are working.');
            addLeadCardsToChat(kaiMsg);
          }
        } else if (intent === 'approvals') {
          const kaiMsg = addChatMsg('acai', '5 things are ready to go — they just need your approval.');
          addApprovalCardsToChat(kaiMsg);
        } else if (intent === 'tasks') {
          const kaiMsg = addChatMsg('acai', 'Your tasks are organized and ready. Kai is keeping everything on track.');
          addTaskCardsToChat(kaiMsg);
        } else if (intent === 'calendar') {
          const kaiMsg = addChatMsg('acai', 'Here is your schedule.');
          addCalendarCardsToChat(kaiMsg);
        } else if (intent === 'companies') {
          const kaiMsg = addChatMsg('acai', 'Here are your companies.');
          addCompanyCardsToChat(kaiMsg);
        } else if (intent === 'reports') {
          const kaiMsg = addChatMsg('acai', 'Here is your business health across all companies — powered by the agent team.');
          addHealthCardsToChat(kaiMsg);
        } else if (text === 'Show me my profile') {
          const kaiMsg = addChatMsg('acai', "Here's your profile. Update your name and how Kai should address you.");
          addSettingsCardToChat('profile', kaiMsg);
        } else if (text === 'Show me my usage') {
          const kaiMsg = addChatMsg('acai', "Here's your current usage across this month and session.");
          addSettingsCardToChat('usage', kaiMsg);
        } else if (text === 'Show me my billing') {
          const kaiMsg = addChatMsg('acai', 'Your plan and billing details. All plans are month-to-month.');
          addSettingsCardToChat('billing', kaiMsg);
        } else if (text === 'Show me my connectors') {
          const kaiMsg = addChatMsg('acai', 'Connect your tools so Kai has live data instead of demo data.');
          addSettingsCardToChat('connectors', kaiMsg);
        } else if (text === 'Show me agent controls') {
          const kaiMsg = addChatMsg('acai', 'Agent controls — manage approvals and notifications for every agent.');
          addSettingsCardToChat('agents', kaiMsg);
        } else if (text === 'Show me my preferences') {
          const kaiMsg = addChatMsg('acai', 'Preferences — theme, display options, and how I behave.');
          addSettingsCardToChat('preferences', kaiMsg);
        } else if (text === 'Show me legal') {
          const kaiMsg = addChatMsg('acai', 'Legal disclaimer and terms of use for AcaiOS.');
          addSettingsCardToChat('legal', kaiMsg);
        } else if (intent === 'settings-profile') {
          const kaiMsg = addChatMsg('acai', "Here\'s your profile. Update your name and how Kai should address you.");
          addSettingsCardToChat('profile', kaiMsg);
        } else if (intent === 'settings-agents') {
          const kaiMsg = addChatMsg('acai', 'Agent controls — manage approvals and notifications for every agent.');
          addSettingsCardToChat('agents', kaiMsg);
        } else if (intent === 'settings-connectors') {
          const kaiMsg = addChatMsg('acai', 'Connect your tools so Kai has live data instead of demo data.');
          addSettingsCardToChat('connectors', kaiMsg);
        } else if (intent === 'settings-usage') {
          const kaiMsg = addChatMsg('acai', "Here\'s your current usage across this month and session.");
          addSettingsCardToChat('usage', kaiMsg);
        } else if (intent === 'settings-billing') {
          const kaiMsg = addChatMsg('acai', 'Your plan and billing details. All plans are month-to-month.');
          addSettingsCardToChat('billing', kaiMsg);
        } else if (intent === 'settings-preferences') {
          const kaiMsg = addChatMsg('acai', 'Preferences — theme, display options, and how I behave.');
          addSettingsCardToChat('preferences', kaiMsg);
        } else if (intent === 'settings-legal') {
          const kaiMsg = addChatMsg('acai', 'Legal disclaimer and terms of use for AcaiOS.');
          addSettingsCardToChat('legal', kaiMsg);
        } else if (intent) {
          const label = intent.charAt(0).toUpperCase() + intent.slice(1);
          addChatMsg('acai', intentReplies[intent] || "I pulled that up.", label);
          scrollUserMsgToTop(userMsg);
        } else {
          addChatMsg('acai', acaiResponses[responseIndex % acaiResponses.length]);
          responseIndex++;
          scrollUserMsgToTop(userMsg);
        }
      }, 700);
    });
  }

  function filterFeed(type, btn) {
    // Update active chip
    document.querySelectorAll('.feed-filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');

    const messages = document.querySelectorAll('#chat-messages .chat-msg');
    messages.forEach(msg => {
      if (type === 'all') {
        msg.classList.remove('feed-hidden');
        return;
      }
      const msgType = msg.dataset.type || '';
      // User messages always show
      if (msg.classList.contains('user')) {
        msg.classList.remove('feed-hidden');
        return;
      }
      if (msgType === type || msgType === 'kai') {
        msg.classList.remove('feed-hidden');
      } else {
        msg.classList.add('feed-hidden');
      }
    });
  }

  function sendChip(text) {
    const input = document.getElementById('chat-input-field');
    if (input) input.value = text;
    sendChatMessage();
  }

  function handleChatKey(e) {
    if (e.key === 'Enter') sendChatMessage();
  }

  function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const messages = document.getElementById('chat-messages');
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.innerHTML = `<div class="chat-bubble" style="display:flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>${escapeHtml(file.name)}</div><div class="chat-time">Now</div>`;
    messages.appendChild(userMsg);
    scrollUserMsgToTop(userMsg);
    requestAnimationFrame(() => {
      const typing = document.createElement('div');
      typing.className = 'chat-msg acai'; typing.dataset.type = 'kai'; typing.id = 'typing-indicator';
      typing.innerHTML = '<div class="chat-sender">Kai</div><div class="chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
      messages.appendChild(typing);
      setTimeout(() => {
        document.getElementById('typing-indicator')?.remove();
        addChatMsg('acai', `I've received <strong>${escapeHtml(file.name)}</strong>. What would you like me to do with it?`);
        scrollChatToBottom();
      }, 1000);
    });
    input.value = '';
  }

  // ── HEALTH TAB ──────────────────────────────────────────

  function setHealthTab(tab, tabEl) {
    document.querySelectorAll('#health-tabs .leads-filter-tab').forEach(t => t.classList.remove('active'));
    if (tabEl) tabEl.classList.add('active');
    const data = {
      all: { rev: '$4,200', trend: '↑ 12%', target: 'Target $8,500', pipe: '$12k', pipeS: '6 open deals', leads: '18', leadsT: '↑ 6', leadsS: 'This month', conv: '26%', convS: '↑ from 19%' },
      dkr: { rev: '$4,200', trend: '↑ 12%', target: 'Target $8,500', pipe: '$8,500', pipeS: '1 open deal', leads: '8', leadsT: '↑ 3', leadsS: 'This month', conv: '31%', convS: '↑ from 22%' },
      realty: { rev: '$1,800', trend: '↑ 5%', target: 'Target $3,000', pipe: '$2,400', pipeS: '2 open deals', leads: '6', leadsT: '↑ 2', leadsS: 'This month', conv: '22%', convS: '↑ from 18%' },
      capital: { rev: '$900', trend: '↑ 8%', target: 'Target $2,000', pipe: '$1,200', pipeS: '1 open deal', leads: '4', leadsT: '', leadsS: 'This month', conv: '18%', convS: 'Steady' },
    };
    const d = data[tab] || data.all;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('health-rev', d.rev); set('health-trend', d.trend); set('health-target', d.target);
    set('health-pipe', d.pipe); set('health-pipe-sub', d.pipeS);
    set('health-leads', d.leads); set('health-leads-trend', d.leadsT); set('health-leads-sub', d.leadsS);
    set('health-conv', d.conv); set('health-conv-sub', d.convS);
  }

  // ── CALENDAR ────────────────────────────────────────────

  const calEvents = {};
  (function () {
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const offset = days => { const x = new Date(today); x.setDate(today.getDate() + days); return x; };
    calEvents[key(today)] = [
      { time: '7:00 AM', duration: '15 min', title: 'Morning briefing — Kai', meta: 'Sent to your phone · All companies', tag: 'All Companies', bar: 'agent' },
      { time: '2:00 PM', duration: '1 hr', title: 'Strategy call · Marcus Williams', meta: 'Google Meet · DKR Consulting', tag: 'DKR Consulting', bar: 'meeting' },
      { time: '2:00 PM', duration: 'EOD', title: 'Proposal due — Riverside Medical', meta: '$8,500 retainer · Kai has draft ready', tag: 'DKR Consulting', bar: 'urgent' },
      { time: '4:00 PM', duration: '30 min', title: 'Follow-up — Sandra Lee', meta: 'Kai drafting · Awaiting your approval', tag: 'DKR Consulting', bar: 'agent' },
    ];
    calEvents[key(offset(1))] = [
      { time: '9:00 AM', duration: '30 min', title: 'Weekly pipeline review', meta: 'Kai prepares summary · All companies', tag: 'All Companies', bar: 'agent' },
      { time: '11:00 AM', duration: '1 hr', title: 'Onboarding — Carlos Rivera', meta: 'Zoom · Send welcome packet beforehand', tag: 'DKR Consulting', bar: 'meeting' },
    ];
    calEvents[key(offset(2))] = [
      { time: '10:00 AM', duration: '45 min', title: 'Site review — Guilt Free Temptations', meta: 'AcaiOS build walkthrough', tag: 'GFT', bar: 'meeting' },
    ];
    calEvents[key(offset(4))] = [
      { time: '5:00 PM', duration: '15 min', title: 'Speed to Lead summary — Kai', meta: 'Operations Supervisor generates automatically', tag: 'All Companies', bar: 'agent' },
    ];
    calEvents[key(offset(-1))] = [
      { time: '11:42 PM', duration: '', title: 'Marcus Williams replied', meta: 'LinkedIn lead · Awaiting your response', tag: 'DKR Consulting', bar: 'urgent' },
    ];
  })();

  let selectedCalDate = null;

  function buildCalWeekStrip() {
    const strip = document.getElementById('cal-week-strip');
    if (!strip) return;
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    strip.innerHTML = '';
    for (let i = -1; i <= 6; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const dateKey = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const isToday = i === 0;
      const pill = document.createElement('div');
      pill.className = 'cal-day-pill' + (isToday ? ' today selected' : '');
      pill.dataset.date = dateKey;
      pill.innerHTML = `<div class="cal-day-name">${days[d.getDay()]}</div><div class="cal-day-num">${d.getDate()}</div><div class="cal-day-dot" style="${calEvents[dateKey] ? '' : 'background:transparent;'}"></div>`;
      pill.onclick = () => selectCalDay(dateKey, pill);
      strip.appendChild(pill);
      if (isToday) selectedCalDate = dateKey;
    }
    renderCalEvents(selectedCalDate);
  }

  function selectCalDay(dateKey, pillEl) {
    selectedCalDate = dateKey;
    document.querySelectorAll('.cal-day-pill').forEach(p => p.classList.remove('selected'));
    pillEl.classList.add('selected');
    renderCalEvents(dateKey);
  }

  function renderCalEvents(dateKey) {
    const container = document.getElementById('cal-events-container');
    if (!container) return;
    const events = calEvents[dateKey] || [];
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const d = new Date(dateKey);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const isToday = dateKey === todayKey;
    const label = isToday ? 'Today' : `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;
    if (events.length === 0) {
      container.innerHTML = `<div class="cal-day-label">${label}</div><div class="cal-empty">Nothing scheduled.<br>Ask Kai to add something.</div>`;
      return;
    }
    container.innerHTML = `<div class="cal-day-label">${label}</div>` + events.map(ev => `
      <div class="cal-event" onclick="closeOverlay('overlay-calendar');sendChatWithIntent('Tell me about: ${ev.title.replace(/'/g, "\\'")}')">
        <div class="cal-event-time-col"><div class="cal-event-time">${ev.time}</div>${ev.duration ? `<div class="cal-event-duration">${ev.duration}</div>` : ''}</div>
        <div class="cal-event-bar ${ev.bar}"></div>
        <div class="cal-event-info"><div class="cal-event-title">${ev.title}</div><div class="cal-event-meta">${ev.meta}</div><div class="cal-event-tag">${ev.tag}</div></div>
      </div>`).join('');
  }

  // ── DOCUMENTS ───────────────────────────────────────────

  const documents = {
    'business-plan': {
      title: 'Business Plan',
      html: `<div style="padding:28px 26px calc(180px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:40px;"><div><div class="doc-section-title">DKR Consulting & Healthcare Solutions</div><div class="doc-section-subtitle">Business Plan · May 2026</div></div><div class="doc-block"><div class="doc-block-label">Mission</div><div class="doc-block-text">DKR Consulting & Healthcare Solutions provides strategic consulting and healthcare advisory services to organizations navigating complex operational and compliance challenges.</div></div><div class="doc-divider"></div><div class="doc-block"><div class="doc-block-label">Revenue Targets</div><div class="doc-stat-row"><span class="doc-stat-label">Monthly Target</span><span class="doc-stat-value">$8,500</span></div><div class="doc-stat-row"><span class="doc-stat-label">Current MTD</span><span class="doc-stat-value">$4,200</span></div><div class="doc-stat-row"><span class="doc-stat-label">Pipeline Value</span><span class="doc-stat-value">$12,000</span></div></div></div>`
    },
    'scope-of-work': {
      title: 'Scope of Work',
      html: `<div style="padding:28px 26px calc(180px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:40px;"><div><div class="doc-section-title">AcaiOS — Scope of Work</div><div class="doc-section-subtitle">Tony Terry · 6 Companies · May 2026</div></div><div class="doc-block"><div class="doc-block-label">Deliverables</div><div class="doc-stat-row"><span class="doc-stat-label">DKR Consulting</span><span class="doc-stat-value">Live ✓</span></div><div class="doc-stat-row"><span class="doc-stat-label">Twizted Vybz Realty</span><span class="doc-stat-value">Live ✓</span></div><div class="doc-stat-row"><span class="doc-stat-label">Generations Capital</span><span class="doc-stat-value">Live ✓</span></div><div class="doc-stat-row"><span class="doc-stat-label">Guilt Free Temptations</span><span class="doc-stat-value">In Build</span></div><div class="doc-stat-row"><span class="doc-stat-label">Twizted Vybz Streetwear</span><span class="doc-stat-value">In Build</span></div><div class="doc-stat-row"><span class="doc-stat-label">TV Healthcare</span><span class="doc-stat-value">Active</span></div></div><div class="doc-divider"></div><div class="doc-block"><div class="doc-block-label">Investment</div><div class="doc-stat-row"><span class="doc-stat-label">Setup Fee</span><span class="doc-stat-value">$1,500</span></div><div class="doc-stat-row"><span class="doc-stat-label">Monthly Retainer</span><span class="doc-stat-value">$20/month</span></div></div></div>`
    },
    'invoice': {
      title: 'Invoice INV-001',
      html: `<div style="padding:28px 26px calc(180px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:40px;"><div><div class="doc-section-title">Invoice INV-001</div><div class="doc-section-subtitle">AcaiOS → Tony Terry · May 2026</div></div><div class="doc-block"><div class="doc-block-label">Line Items</div><div class="doc-stat-row"><span class="doc-stat-label">Website Build — 3 Sites</span><span class="doc-stat-value">$900</span></div><div class="doc-stat-row"><span class="doc-stat-label">AI Agent Setup — 6 Agents</span><span class="doc-stat-value">$400</span></div><div class="doc-stat-row"><span class="doc-stat-label">Client Portal Setup</span><span class="doc-stat-value">$200</span></div><div class="doc-stat-row" style="font-weight:700;"><span class="doc-stat-label" style="color:var(--text-primary);">Total</span><span class="doc-stat-value" style="font-size:18px;">$1,500</span></div></div><div class="doc-divider"></div><div class="doc-block"><div class="doc-block-label">Payment</div><div class="doc-stat-row"><span class="doc-stat-label">Deposit Due Now</span><span class="doc-stat-value" style="color:var(--accent);font-weight:700;">$750</span></div><div class="doc-stat-row"><span class="doc-stat-label">Monthly Retainer</span><span class="doc-stat-value">$20/month</span></div></div></div>`
    },
    'riverside-proposal': {
      title: 'Riverside Medical Proposal',
      html: `<div style="padding:28px 26px calc(180px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:40px;"><div><div class="doc-section-title">Proposal for Consulting Services</div><div class="doc-section-subtitle">Riverside Medical Group · DKR Consulting · May 2026</div></div><div class="doc-block"><div class="doc-block-label">Overview</div><div class="doc-block-text">DKR Consulting proposes a dedicated operational consulting engagement to support Riverside Medical Group across workflow optimization, staff coordination, and compliance readiness.</div></div><div class="doc-divider"></div><div class="doc-block"><div class="doc-block-label">Investment</div><div class="doc-stat-row"><span class="doc-stat-label">Monthly Retainer</span><span class="doc-stat-value" style="font-size:20px;font-weight:700;">$8,500</span></div><div class="doc-stat-row"><span class="doc-stat-label">Commitment</span><span class="doc-stat-value">None — month to month</span></div><div class="doc-stat-row"><span class="doc-stat-label">Start Date</span><span class="doc-stat-value">Upon agreement</span></div></div></div>`
    }
  };

  function openDoc(docId) {
    const doc = documents[docId];
    if (!doc) return;
    document.getElementById('doc-overlay-title').textContent = doc.title;
    document.getElementById('doc-overlay-body').innerHTML = doc.html;
    openOverlay('overlay-doc');
  }

  // ── COMPANY DATA ─────────────────────────────────────────

  const companyData = {
    dkr: { id: 'dkr', name: 'DKR Consulting & Healthcare Solutions', short: 'DKR Consulting', status: 'Live', snapshot: { revenue: '$4,200', revTrend: '↑ 12%', leads: '8', leadsTrend: '↑ 3', deals: '4', dealsTrend: '↑ 2', tasks: '5' }, leads: [{ name: 'Marcus Williams', note: 'Replied yesterday · needs follow up' }, { name: 'Sandra Lee', note: 'Requested pricing · 3 days ago' }, { name: 'James Porter', note: 'Website form · this morning' }], today: [{ title: 'Strategy call with Marcus Williams', meta: '2:00 PM · Google Meet' }, { title: 'Follow-up due: Sandra Lee', meta: 'Last contacted 3 days ago' }], approvals: [{ label: 'Follow-up drafted · Lead Nurture', message: 'Ready to send to Marcus Williams at 2:00 PM.', preview: '"Hi Marcus, I wanted to follow up on our conversation yesterday. I\'d love to connect this week to explore how DKR Consulting can support your operations at Helix Health. Would Thursday or Friday work for a quick 20-minute call?"', action: 'Approve' }, { label: 'Proposal ready · Outbound Agent', message: 'Riverside Medical Group — $8,500 retainer. Due EOD.', preview: '"Dear Riverside Medical team, please find attached our proposal for operational consulting services."', action: 'Send Proposal', docId: 'riverside-proposal' }], agents: [{ name: 'Inbound Agent', status: 'active', action: 'Responded to Sandra Lee and James Porter overnight.', time: 'Last run 7:14 AM' }, { name: 'Outbound Agent', status: 'active', action: 'Morning briefing sent. Proposal deadline flagged.', time: 'Last run 7:00 AM' }, { name: 'Lead Nurture', status: 'queued', action: 'Drafted follow-up to Marcus Williams.', time: 'Fires at 2:00 PM' }, { name: 'Speed to Lead', status: 'sleeping', action: 'Next report Friday.', time: 'Next run Fri May 22 · 5PM' }], docs: [{ name: 'Business Plan', meta: 'DKR Consulting · May 2026', docId: 'business-plan' }, { name: 'Scope of Work', meta: 'AcaiOS Services · 6 companies', docId: 'scope-of-work' }, { name: 'Invoice INV-001', meta: '$1,500 setup · $750 deposit due', docId: 'invoice' }] },
    realty: { id: 'realty', name: 'Twizted Vybz Realty and Management', short: 'Twizted Vybz Realty', status: 'Live', snapshot: { revenue: '$1,800', revTrend: '↑ 5%', leads: '5', leadsTrend: '↑ 2', deals: '2', dealsTrend: '↑ 1', tasks: '3' }, leads: [{ name: 'David Chen', note: 'Property inquiry · yesterday' }, { name: 'Angela Moore', note: 'Rental management interest · 2 days ago' }], today: [{ title: 'Property walkthrough — 1420 Cypress Way', meta: '11:00 AM · Katy, TX' }, { title: 'Send lease to David Chen', meta: 'Due today' }], approvals: [{ label: 'Listing drafted · Outbound Agent', message: 'New listing ready — 1420 Cypress Way, Katy TX.', preview: '"3BR/2BA in Katy, TX. 1,850 sq ft. Recently renovated. Available June 1. Monthly rent: $2,200."', action: 'Publish Listing' }], agents: [{ name: 'Inbound Agent', status: 'active', action: 'Responded to 2 new property inquiries.', time: 'Last run 8:00 AM' }, { name: 'Lead Nurture', status: 'queued', action: 'Drafted follow-up to Angela Moore.', time: 'Fires in 1 hour' }], docs: [{ name: 'Property Portfolio', meta: 'Twizted Vybz Realty · May 2026', docId: 'business-plan' }] },
    capital: { id: 'capital', name: 'Twizted Vybz Generations Capital', short: 'Generations Capital', status: 'Live', snapshot: { revenue: '$12,500', revTrend: '↑ 22%', leads: '3', leadsTrend: '↑ 1', deals: '1', dealsTrend: '—', tasks: '4' }, leads: [{ name: 'Robert Finley', note: 'Investment inquiry · this week' }, { name: 'Carla Simmons', note: 'Wealth planning · 4 days ago' }], today: [{ title: 'Investment review call — Robert Finley', meta: '3:00 PM · Zoom' }, { title: 'Q2 portfolio update due', meta: 'End of day' }], approvals: [{ label: 'Outreach drafted · Lead Generation Agent', message: 'Ready to send to 3 qualified prospects.', preview: '"Hi Robert, I came across your profile and wanted to reach out about capital growth opportunities."', action: 'Send Outreach' }], agents: [{ name: 'Lead Research Agent', status: 'active', action: 'Qualified 3 new prospects from LinkedIn.', time: 'Last run 6:45 AM' }, { name: 'Outbound Agent', status: 'active', action: 'Call with Robert Finley confirmed for 3PM.', time: 'Last run 7:00 AM' }], docs: [{ name: 'Investment Overview', meta: 'Generations Capital · May 2026', docId: 'business-plan' }] },
    guilt: { id: 'guilt', name: 'Guilt Free Temptations', short: 'Guilt Free Temptations', status: 'In Build', snapshot: { revenue: '—', revTrend: '', leads: '—', leadsTrend: '', deals: '—', dealsTrend: '', tasks: '2' }, leads: [], today: [{ title: 'Site build in progress', meta: 'AcaiOS building now' }], approvals: [], agents: [{ name: 'Onboarding Agent', status: 'sleeping', action: 'Waiting for site launch.', time: 'Activates at launch' }], docs: [{ name: 'Brand Brief', meta: 'Guilt Free Temptations · Ice cream', docId: 'business-plan' }] },
    streetwear: { id: 'streetwear', name: 'Twizted Vybz (Streetwear)', short: 'Twizted Vybz', status: 'In Build', snapshot: { revenue: '—', revTrend: '', leads: '—', leadsTrend: '', deals: '—', dealsTrend: '', tasks: '2' }, leads: [], today: [{ title: 'Site build in progress', meta: 'AcaiOS building now' }], approvals: [], agents: [{ name: 'Inbound Agent', status: 'sleeping', action: 'Waiting for site launch.', time: 'Activates at launch' }], docs: [{ name: 'Brand Direction', meta: 'Twizted Vybz Streetwear · May 2026', docId: 'business-plan' }] },
    healthcare: { id: 'healthcare', name: 'Twizted Vybz Healthcare & Consulting', short: 'TV Healthcare', status: 'Live', snapshot: { revenue: '$1,800', revTrend: '↑ 5%', leads: '2', leadsTrend: '↑ 1', deals: '1', dealsTrend: '—', tasks: '2' }, leads: [{ name: 'Pamela Grant', note: 'Healthcare staffing inquiry · today' }, { name: 'Terrence Okafor', note: 'Clinic operations consult · yesterday' }], today: [{ title: 'Review staffing inquiry — Pamela Grant', meta: 'Received this morning' }, { title: 'Follow-up due: Terrence Okafor', meta: 'Initial contact was yesterday' }], approvals: [{ label: 'Response drafted · Inbound Agent', message: 'Ready to send to Pamela Grant.', preview: '"Hi Pamela, thank you for reaching out. We specialize in healthcare staffing in the Greater Houston area."', action: 'Approve' }], agents: [{ name: 'Inbound Agent', status: 'active', action: 'Drafted responses to Pamela and Terrence.', time: 'Last run 8:30 AM' }, { name: 'Lead Nurture', status: 'queued', action: 'Drafted follow-up to Terrence Okafor.', time: 'Fires in 2 hours' }], docs: [{ name: 'Services Overview', meta: 'TV Healthcare · Logo swap · DKR site', docId: 'business-plan' }] }
  };

  function renderCompanyScreen(id) {
    const d = companyData[id];
    if (!d) return;
    const nameEl = document.getElementById('co-detail-name');
    const statusEl = document.getElementById('co-detail-status');
    if (nameEl) nameEl.textContent = d.short;
    if (statusEl) statusEl.textContent = d.status;
    const body = document.getElementById('co-detail-body');
    if (!body) return;

    const leadsHtml = d.leads.length === 0
      ? '<div class="row"><div class="row-primary" style="color:var(--text-tertiary);">No active leads yet</div></div>'
      : d.leads.map(l => `<div class="row"><div class="row-primary">${l.name}</div><div class="row-secondary">${l.note}</div></div>`).join('');

    const todayHtml = d.today.map(t => `<div class="row"><div class="row-primary">${t.title}</div><div class="row-secondary">${t.meta}</div></div>`).join('');

    const approvalsHtml = d.approvals.length === 0 ? '' : `
      <section>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div class="section-label" style="margin-bottom:0;">Needs Your Approval</div>
          <div style="font-size:13px;color:var(--text-tertiary);" id="approval-counter-co">1 of ${d.approvals.length}</div>
        </div>
        <div class="approval-carousel"><div class="approval-track" id="approval-track-co">
          ${d.approvals.map((a, i) => `<div class="approval-slide"><div class="approval-card">
            <button class="approval-dismiss-x" onclick="handleApproval(${i},'ignore','company')" aria-label="Dismiss"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            <div class="approval-card-header"><div class="approval-acai-dot"></div><div class="approval-label">${a.label}</div></div>
            <div class="approval-message">${a.message}</div>
            <div class="approval-preview" onclick="this.classList.toggle('expanded')">${a.preview}</div>
            ${a.docId ? `<div class="approval-view-link" onclick="openDoc('${a.docId}')"><span>View document</span><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>` : ''}
            <div class="approval-actions"><button class="approval-btn approve" onclick="handleApproval(${i},'approve','company')">${a.action}</button><button class="approval-btn edit" onclick="handleApproval(${i},'ignore','company')">Edit</button></div>
          </div></div>`).join('')}
        </div>
        <div class="snapshot-dots" id="approval-dots-co" style="margin-top:12px;">
          ${d.approvals.map((_, i) => `<div class="snapshot-dot${i === 0 ? ' active' : ''}" onclick="goToApproval(${i},'company')"></div>`).join('')}
        </div></div>
      </section>`;

    const agentsHtml = d.agents.map(a => `
      <div class="agent-card" onclick="toggleAgentCard(this)"><div class="agent-card-top"><div class="agent-card-name">${a.name}</div><div class="agent-status ${a.status}"><div class="agent-status-dot"></div>${a.status.charAt(0).toUpperCase() + a.status.slice(1)}</div><svg class="agent-card-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div><div class="agent-card-preview">${a.time}</div><div class="agent-card-action">${a.action}</div><div class="agent-card-tap-hint"><span class="agent-card-tap-hint-label">Expand</span><span class="agent-card-tap-hint-time">${a.time}</span></div><div class="agent-card-body"><div class="agent-card-time">${a.time}</div></div></div>`).join('');

    const docsHtml = d.docs.map(doc => `
      <div class="doc-row" onclick="openDoc('${doc.docId}')">
        <div class="doc-row-left"><div class="doc-row-name">${doc.name}</div><div class="doc-row-meta">${doc.meta}</div></div>
        <svg class="doc-row-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
      </div>`).join('');

    body.innerHTML = `
      <section class="section">
        <div class="co-section-head"><div class="co-section-title">Financial Snapshot</div><div class="co-section-count">May 1 – May 27</div></div>
        <div class="finance-card">
          <div class="finance-top">
            <div class="finance-cell"><div class="finance-label">Gross Volume</div><div class="finance-value">$4.2k</div></div>
            <div class="finance-cell"><div class="finance-label">Payments</div><div class="finance-value">14</div></div>
            <div class="finance-cell"><div class="finance-label">Customers</div><div class="finance-value">8</div></div>
          </div>
          <div class="finance-main">
            <div class="finance-kicker">Gross Volume</div>
            <div class="finance-row">
              <div><div class="finance-big">$4,200</div><div class="finance-sub">May 1 – May 27</div></div>
              <div class="finance-trend">↑ 12%</div>
            </div>
            <div class="finance-chart">
              <svg viewBox="0 0 340 132" preserveAspectRatio="none">
                <defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#a98aff" stop-opacity=".30"/><stop offset="100%" stop-color="#a98aff" stop-opacity="0"/></linearGradient></defs>
                <path d="M0 105 L30 86 L60 94 L90 70 L120 79 L150 55 L180 68 L210 52 L240 61 L270 38 L300 51 L340 24 L340 132 L0 132 Z" fill="url(#fill)"/>
                <path d="M0 105 L30 86 L60 94 L90 70 L120 79 L150 55 L180 68 L210 52 L240 61 L270 38 L300 51 L340 24" fill="none" stroke="#a98aff" stroke-width="4" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
          <div class="finance-list">
            <div class="finance-list-row"><div><div class="finance-list-title">Successful payments</div><div class="finance-list-sub">May 1 – May 27</div></div><div class="finance-list-val">14</div></div>
            <div class="finance-list-row"><div><div class="finance-list-title">New customers</div><div class="finance-list-sub">May 1 – May 27</div></div><div class="finance-list-val">8</div></div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="co-section-head"><div class="co-section-title">Operations Snapshot</div><div class="co-section-count">today</div></div>
        <div class="co-grid-2">
          <div class="co-mini"><div class="co-mini-label">New Leads</div><div class="co-mini-value">${d.snapshot.leads}</div><div class="co-mini-sub">3 need attention</div></div>
          <div class="co-mini"><div class="co-mini-label">Open Tasks</div><div class="co-mini-value">${d.snapshot.tasks}</div><div class="co-mini-sub">2 approvals waiting</div></div>
          <div class="co-mini"><div class="co-mini-label">Meetings</div><div class="co-mini-value">1</div><div class="co-mini-sub">Marcus at 2 PM</div></div>
          <div class="co-mini"><div class="co-mini-label">Agents</div><div class="co-mini-value">${d.agents.length}</div><div class="co-mini-sub">Running live</div></div>
        </div>
      </section>

      ${approvalsHtml}

      <section class="section">
        <div class="co-section-head"><div class="co-section-title">Agents</div><div class="co-section-count">${d.agents.length}</div></div>
        <div style="display:flex;flex-direction:column;gap:14px;">${agentsHtml}</div>
      </section>

      <section class="section">
        <div class="co-section-head"><div class="co-section-title">Leads</div><div class="co-section-count">${d.leads.length}</div></div>
        ${leadsHtml}
        <div class="row-link" onclick="closeOverlay('overlay-company-detail');openOverlay('overlay-leads')">View all leads <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>
      </section>

      <section class="section">
        <div class="co-section-head"><div class="co-section-title">Documents</div></div>
        ${docsHtml}
      </section>

      <section class="section">
        <article class="co-rec">
          <div class="finance-kicker">Kai Recommendation</div>
          <h3>Handle the two approvals before the 2 PM strategy call.</h3>
          <p>DKR has momentum today. Clearing the proposal and Marcus follow-up keeps the company moving without bottlenecks.</p>
        </article>
      </section>
    `;
  }

  // ── DOM READY ────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    // ── DRAGGABLE INPUT BAR ──────────────────────────────────
    const bar = document.getElementById('global-input-bar');
    let isDragging = false, startY = 0, startBottom = 0;
    const DRAG_THRESHOLD = 0;
    let touchStartY = 0, didDrag = false;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    bar.addEventListener('touchstart', function(e) {
      if (e.target.closest('textarea')) return;
      if (isIOS ? e.target.closest('button') : e.target.closest('button, input')) return;
      touchStartY = e.touches[0].clientY;
      didDrag = false;
      startBottom = parseInt(bar.style.bottom) || 40;
      startY = e.touches[0].clientY;
    }, { passive: true });

    bar.addEventListener('touchmove', function(e) {
      if (e.target.closest('textarea')) return;
      if (isIOS ? e.target.closest('button') : e.target.closest('button, input')) return;
      const dy = Math.abs(e.touches[0].clientY - touchStartY);
      if (dy > DRAG_THRESHOLD) {
        if (!isDragging) {
          isDragging = true;
          didDrag = true;
          bar.classList.add('dragging', 'floating');
          bar.style.left = '50%';
          bar.style.right = 'auto';
          bar.style.transform = 'translateX(-50%)';
          bar.style.margin = '0';
        }
        const newBottom = startBottom + (startY - e.touches[0].clientY);
        const maxBottom = window.innerHeight - bar.offsetHeight - 8;
        bar.style.bottom = Math.max(8, Math.min(newBottom, maxBottom)) + 'px';
        e.preventDefault();
      }
    }, { passive: false });

    bar.addEventListener('touchend', function() {
      if (isDragging) {
        isDragging = false;
        bar.classList.remove('dragging');
        const currentBottom = parseInt(bar.style.bottom) || 40;
        if (currentBottom <= 42) {
          bar.classList.remove('floating');
          bar.style.bottom = '';
          bar.style.left = '';
          bar.style.right = '';
          bar.style.transform = '';
          bar.style.margin = '';
        }
      }
    }, { passive: true });
    // ────────────────────────────────────────────────────────

    // Swipe LEFT on notification panel to close it (swipe-up removed — too easy to trigger accidentally)
    const notifPanel = document.getElementById('notif-panel');
    if (notifPanel) {
      let notifStartX = 0, notifStartY = 0;
      notifPanel.addEventListener('touchstart', function(e) {
        notifStartX = e.touches[0].clientX;
        notifStartY = e.touches[0].clientY;
      }, { passive: true });
      notifPanel.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].clientX - notifStartX;
        const dy = e.changedTouches[0].clientY - notifStartY;
        const swipeLeft = dx < -50 && Math.abs(dy) < Math.abs(dx) * 0.6;
        if (swipeLeft) {
          notifPanel.style.opacity = '0';
          notifPanel.style.transform = 'translateX(-50%) translateY(-8px)';
          setTimeout(() => {
            notifPanel.classList.remove('open');
            notifPanel.style.opacity = '';
            notifPanel.style.transform = '';
          }, 200);
        }
      }, { passive: true });

      // Notif panel closes via swipe left only — tap outside does NOT close it
    }

    // Swipe left on drawer to close it
    const drawer = document.getElementById('side-drawer');
    if (drawer) {
      let drawerStartX = 0, drawerStartY = 0;
      drawer.addEventListener('touchstart', function(e) {
        drawerStartX = e.touches[0].clientX;
        drawerStartY = e.touches[0].clientY;
      }, { passive: true });
      drawer.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].clientX - drawerStartX;
        const dy = Math.abs(e.changedTouches[0].clientY - drawerStartY);
        // Swipe left — lower threshold (30px), must be more horizontal than vertical
        if (dx < -30 && dy < Math.abs(dx)) closeDrawer();
      }, { passive: true });
    }

    // Approval carousel swipe
    const carousel = document.getElementById('approval-carousel');
    if (carousel) {
      carousel.addEventListener('touchstart', e => {
        approvalStartX = e.touches[0].clientX;
        e.stopPropagation();
      }, { passive: true });
      carousel.addEventListener('touchmove', e => {
        e.stopPropagation();
      }, { passive: true });
      carousel.addEventListener('touchend', e => {
        e.stopPropagation();
        const diff = approvalStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
          if (diff > 0) goToApproval(homeApprovalState.current + 1);
          else goToApproval(homeApprovalState.current - 1);
        }
      }, { passive: true });
    }
  });

  // ── PWA: Register service worker ────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // ── MODEL SELECTOR ──────────────────────────────────────
  let activeModel = 'claude-sonnet-4-6';
  let activeModelLabel = 'Sonnet 4.6';

  function openModelSheet() {
    const sheet = document.getElementById('model-sheet');
    const overlay = document.getElementById('model-sheet-overlay');
    sheet.style.display = 'block';
    overlay.style.display = 'block';
    requestAnimationFrame(() => {
      sheet.style.opacity = '1';
      sheet.style.transform = 'translateX(-50%) translateY(0)';
    });
  }

  function closeModelSheet() {
    const sheet = document.getElementById('model-sheet');
    sheet.style.opacity = '0';
    sheet.style.transform = 'translateX(-50%) translateY(8px)';
    setTimeout(() => {
      sheet.style.display = 'none';
      document.getElementById('model-sheet-overlay').style.display = 'none';
    }, 200);
  }

  function selectModel(modelId, label) {
    activeModel = modelId;
    activeModelLabel = label;
    // Update model label in icon row
    const label_el = document.getElementById('model-pill-label');
    if (label_el) label_el.textContent = label;
    // Update checkmarks
    document.querySelectorAll('.model-opt-check').forEach(c => c.style.display = 'none');
    const key = modelId.includes('haiku') ? 'haiku' : modelId.includes('opus') ? 'opus' : 'sonnet';
    const check = document.getElementById('check-' + key);
    if (check) check.style.display = 'block';
    // Highlight active row
    document.querySelectorAll('.model-option').forEach(o => o.style.background = '');
    const activeOpt = document.getElementById('model-opt-' + key);
    if (activeOpt) activeOpt.style.background = 'rgba(255,255,255,0.05)';
    closeModelSheet();
  }

  // ── INPUT BAR: Solid background when user types ──────────
  (function() {
    function setInputSolid(solid) {
      const pill = document.querySelector('.input-bar');
      if (!pill) return;
      pill.classList.toggle('active', solid);
    }
    document.addEventListener('DOMContentLoaded', function() {
      const input = document.getElementById('acai-input');
      if (!input) return;
      input.addEventListener('focus', () => setInputSolid(true));
      input.addEventListener('blur',  () => { if (!input.value.trim()) setInputSolid(false); });
      input.addEventListener('input', () => setInputSolid(input.value.length > 0));
    });
  })();

  // ── SUPABASE WIRING ─────────────────────────────────────────

  const TONY_USER_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

  async function sbQuery(table, filters = {}, order = 'created_at.desc', limit = 50) {
    const res = await fetch('/api/supabase', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ table, action: 'select', filters, order, limit })
    });
    if (!res.ok) throw new Error(`Supabase ${table} → ${res.status}`);
    const json = await res.json();
    return json.data || [];
  }

  async function sbInsert(table, data) {
    const res = await fetch('/api/supabase', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ table, action: 'insert', data })
    });
    if (!res.ok) throw new Error(`Supabase insert ${table} → ${res.status}`);
    const json = await res.json();
    return json.data || [];
  }

  async function sbUpdate(table, data, filters = {}) {
    const res = await fetch('/api/supabase', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ table, action: 'update', data, filters })
    });
    if (!res.ok) throw new Error(`Supabase update ${table} → ${res.status}`);
    const json = await res.json();
    return json.data || [];
  }

  function fmtDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const today = new Date(); today.setHours(0,0,0,0);
      const diff = Math.floor((d - today) / 86400000);
      if (diff === 0)  return 'Today';
      if (diff === 1)  return 'Tomorrow';
      if (diff === -1) return 'Yesterday';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch(e) { return iso; }
  }

  // ── RENDER: LEADS ────────────────────────────────────────
  function renderLeads(pages) {
    const list = document.getElementById('leads-list');
    if (!list || !pages.length) return;
    list.innerHTML = '';
    pages.forEach((page, i) => {
      const name    = page.name || 'Unnamed Lead';
      const company = page.company || '';
      const title   = '';
      const source  = page.source || '';
      const status  = page.status || 'new';
      const phone   = page.phone || '';
      const biz     = page.company || 'DKR Consulting';
      const notes   = page.notes || '';
      const value   = page.value || '';
      const isHot   = status.toLowerCase() === 'hot';
      const label   = isHot ? 'Supervisor flagged · Hot lead' : 'New lead · Inbound Agent responded';
      const preview = notes || [title, company].filter(Boolean).join(' · ') || biz;
      const badgeCls = isHot ? 'hot' : 'new';
      const safeName = name.replace(/'/g, "\\'");
      const card = document.createElement('div');
      card.className = 'lead-card';
      card.dataset.filter = isHot ? 'hot' : 'new';
      card.innerHTML = `
        <button class="lead-card-dismiss" onclick="toggleLeadCard(${i})" aria-label="Toggle">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <div class="lead-card-header"><div class="approval-acai-dot"></div><div class="lead-card-label">${label}</div></div>
        <div class="lead-card-name">${name}</div>
        <div class="lead-card-preview" id="lcp-${i}" onclick="toggleLeadCard(${i})">${preview}</div>
        <div class="lead-card-hint" id="lch-${i}" onclick="toggleLeadCard(${i})">Expand ↓</div>
        <div class="lead-card-body collapsed" id="lcb-${i}">
          <div class="lead-meta">${[source, biz, phone].filter(Boolean).join(' · ')}</div>
          <div style="display:flex;gap:8px;margin-top:4px;">
            <div class="lead-badge ${badgeCls}">${status}</div>
            ${value ? `<div class="lead-badge new">${typeof value === 'number' ? '$' + Number(value).toLocaleString() : value}</div>` : ''}
          </div>
          <div class="lead-card-actions">
            <button class="lead-card-btn primary" onclick="closeOverlay('overlay-leads');sendChatWithIntent('Tell me about ${safeName}')">View Details</button>
            <button class="lead-card-btn secondary" onclick="closeOverlay('overlay-leads');sendChatWithIntent('Draft follow-up for ${safeName}')">Draft Reply</button>
          </div>
        </div>`;
      list.appendChild(card);
    });
  }

  // ── RENDER: APPROVALS ────────────────────────────────────
  function renderApprovals(pages) {
    const carousel = document.getElementById('approval-carousel');
    if (!carousel) return;
    const pending = pages.filter(p => {
      const s = (p.status || '').toLowerCase();
      return s !== 'approved' && s !== 'rejected' && s !== 'sent';
    });
    if (!pending.length) return;
    // Remove existing slides
    carousel.querySelectorAll('.approval-slide').forEach(s => s.remove());
    pending.forEach((page, i) => {
      const title  = page.title || 'Pending approval';
      const agent  = page.agent || 'Kai';
      const type   = page.type || 'Draft';
      const recip  = page.recipient || '';
      const draft  = page.draft || '';
      const amount = page.amount || '';
      const label  = `${type} · ${agent}`;
      const msg    = recip ? `Ready to send to ${recip}${amount ? ' · ' + amount : ''}.` : title;
      const slide  = document.createElement('div');
      slide.className = 'approval-slide';
      slide.innerHTML = `
        <div class="approval-card">
          <div class="approval-card-header"><div class="approval-acai-dot"></div><div class="approval-label">${label}</div></div>
          <div class="approval-message">${msg}</div>
          ${draft ? `
          <div class="approval-preview" id="preview-n${i}" onclick="togglePreview('n${i}')">${draft}</div>
          <div class="approval-preview-hint" id="hint-n${i}" onclick="togglePreview('n${i}')">Tap to read full message ↓</div>` : ''}
          <div class="approval-actions">
            <button class="approval-btn approve" onclick="handleApproval('n${i}','approve')">Approve</button>
            <button class="approval-btn edit"    onclick="handleApproval('n${i}','ignore')">Edit</button>
          </div>
        </div>`;
      carousel.appendChild(slide);
    });
  }

  // ── RENDER: TASKS ────────────────────────────────────────
  function renderTasks(pages) {
    const todayList    = document.getElementById('tasks-today');
    const upcomingList = document.getElementById('tasks-upcoming');
    if (!todayList && !upcomingList) return;
    const now = new Date(); now.setHours(23,59,59,999);
    const todayItems = [], upcomingItems = [];
    pages.forEach(page => {
      const task     = page.task || 'Untitled task';
      const biz      = page.company || '';
      const priority = page.priority || 'medium';
      const due      = page.due_date || '';
      const status   = page.status || '';
      const kaiNote  = page.kai_note || '';
      const cat      = page.category || '';
      const s = status.toLowerCase();
      if (s === 'done' || s === 'complete' || s === 'completed') return;
      const dueDate  = due ? new Date(due) : null;
      const isToday  = dueDate ? dueDate <= now : false;
      const obj = { task, biz, priority, due, kaiNote, cat, status, dueDate };
      if (isToday) todayItems.push(obj); else upcomingItems.push(obj);
    });

    function buildRow(t, id) {
      const p = t.priority.toLowerCase();
      const pCls = p === 'high' ? 'high' : p === 'low' ? 'low' : 'medium';
      const dueStr = t.due ? fmtDate(t.due) : '';
      const urgent = t.dueDate && t.dueDate <= new Date();
      return `<div class="task-row" data-filter="today">
        <div class="task-check" id="check-${id}" onclick="toggleTask(event,'${id}')"></div>
        <div class="task-info">
          <div class="task-title" id="title-${id}">${t.task}</div>
          <div class="task-meta">${t.kaiNote || t.cat || t.status || ''}</div>
          ${t.biz ? `<div class="task-company-tag">${t.biz}</div>` : ''}
        </div>
        <div class="task-right">
          ${dueStr ? `<div class="task-due${urgent ? ' urgent' : ''}">${dueStr}</div>` : ''}
          <div class="task-priority ${pCls}"></div>
        </div>
      </div>`;
    }

    if (todayList && todayItems.length)
      todayList.innerHTML = todayItems.map((t,i) => buildRow(t,'nt'+i)).join('');
    if (upcomingList && upcomingItems.length)
      upcomingList.innerHTML = upcomingItems.map((t,i) => buildRow(t,'nu'+i)).join('');
  }

  // ── RENDER: BUSINESS HEALTH ──────────────────────────────
  function renderHealth(pages) {
    if (!pages.length) return;
    let totalRev = 0, totalTarget = 0;
    const bars = [];
    pages.forEach(page => {
      const name   = page.business_name || page.name || '';
      const rev    = parseFloat(page.revenue_mtd || page.revenue || 0) || 0;
      const target = parseFloat(page.monthly_target || page.target || 0) || 0;
      totalRev    += rev;
      totalTarget += target;
      if (name && (rev > 0 || target > 0)) bars.push({ name, rev, target });
    });

    if (totalRev > 0) {
      const revEl = document.getElementById('health-rev');
      if (revEl) revEl.textContent = '$' + totalRev.toLocaleString();
    }
    if (totalTarget > 0) {
      const targetEl = document.getElementById('health-target');
      if (targetEl) targetEl.textContent = 'Target $' + totalTarget.toLocaleString();
      const trendEl = document.getElementById('health-trend');
      if (trendEl) {
        const pct = Math.round((totalRev / totalTarget) * 100);
        trendEl.textContent = pct + '% of target';
      }
    }

    // Rebuild revenue-by-company bars if container exists
    const barSection = document.querySelector('.rev-by-company');
    if (barSection && bars.length) {
      barSection.innerHTML = bars.map(b => {
        const pct = b.target > 0 ? Math.min(Math.round((b.rev / b.target) * 100), 100) : 0;
        return `<div style="margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:15px;font-weight:500;">${b.name}</span>
            <span style="font-size:15px;color:var(--text-secondary);">$${b.rev.toLocaleString()}</span>
          </div>
          <div style="height:4px;background:rgba(255,255,255,0.08);border-radius:2px;">
            <div style="width:${pct}%;height:100%;background:rgba(255,255,255,0.35);border-radius:2px;transition:width 0.6s ease;"></div>
          </div>
          <div style="font-size:13px;color:var(--text-tertiary);margin-top:6px;">${pct}% of monthly target</div>
        </div>`;
      }).join('');
    }
  }

  // ── KICK OFF ─────────────────────────────────────────────
  async function loadSupabaseData() {
    try {
      const userId = TONY_USER_ID;
      const [leadsData, approvalsData, tasksData] = await Promise.all([
        sbQuery('leads', {}, 'created_at.desc', 50),
        sbQuery('approvals', {}, 'created_at.desc', 20),
        sbQuery('tasks', {}, 'due_date.asc', 50)
      ]);
      renderLeads(leadsData);
      renderApprovals(approvalsData);
      renderTasks(tasksData);
    } catch(e) {
      // Fail silently — hardcoded demo content stays visible
      console.warn('[AcaiOS] Supabase load failed:', e.message);
    }
  }

  // ── SECTION BAR PILLS ───────────────────────────────────────
  function renderSectionPills(bar) {
    const pillsAttr = bar.getAttribute('data-pills');
    if (!pillsAttr) return;
    const existing = bar.querySelector('.chat-section-pills');
    if (existing) return;
    const wrap = document.createElement('div');
    wrap.className = 'chat-section-pills';
    pillsAttr.split('|').forEach((label, i) => {
      const pill = document.createElement('span');
      pill.className = 'chat-section-pill' + (i === 0 ? ' green' : i === 1 ? ' purple' : '');
      pill.textContent = label.trim();
      wrap.appendChild(pill);
    });
    bar.appendChild(wrap);
  }

  document.addEventListener('DOMContentLoaded', function() {
    // Load live Supabase data
    loadSupabaseData();

    // Init section bar pills and observe for new ones
    document.querySelectorAll('.chat-section-bar').forEach(renderSectionPills);
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('chat-section-bar')) renderSectionPills(node);
            node.querySelectorAll && node.querySelectorAll('.chat-section-bar').forEach(renderSectionPills);
          }
        });
      });
    });
    observer.observe(document.getElementById('chat-messages') || document.body, { childList: true, subtree: true });
  });

  // ── VISUAL VIEWPORT — keep bar above keyboard on Android ──
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function() {
      const bar = document.getElementById('global-input-bar');
      if (!bar) return;
      const offsetFromBottom = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop;
      bar.style.bottom = Math.max(40, offsetFromBottom + 8) + 'px';
    });
  }

  // ── NAV IN CHAT ─────────────────────────────────────────
  function addNavToChat() {
    if (!chatOpen) openChat();
    setTimeout(() => {
      const messages = document.getElementById('chat-messages');
      if (!messages) return;

      const kaiMsg = addChatMsg('acai', 'Where would you like to go?');

      const items = [
        { icon: '<path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><polyline points="9 21 9 12 15 12 15 21"/>', label: 'Home', action: "closeChat()" },
        { icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>', label: 'AI Agents', action: "sendChip('Show me all my agents')" },
        { icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', label: 'Leads', action: "sendChip('Show me my leads')" },
        { icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>', label: 'Approvals', action: "sendChip('Show me my approvals')" },
        { icon: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>', label: 'Tasks', action: "sendChip('Show me my tasks')" },
        { icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>', label: 'Calendar', action: "sendChip('Show me my calendar')" },
        { icon: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>', label: 'My Companies', action: "sendChip('Show me my companies')" },
        { icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>', label: 'Business Health', action: "sendChip('Show me business health')" },
      ];

      const wrapper = document.createElement('div');
      wrapper.className = 'chat-msg acai'; wrapper.dataset.type = 'nav';

      const cardsWrap = document.createElement('div');
      cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:12px;width:100%;margin-top:4px;';

      const allItems = [];

      items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'agent-card';
        card.style.cssText = 'opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;cursor:pointer;';
        card.innerHTML = `
          <div class="agent-card-top" style="gap:14px;">
            <div class="stt-icon" style="flex-shrink:0;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg></div>
            <div class="agent-card-name">${item.label}</div>
            <svg class="stt-chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </div>`;
        card.onclick = new Function(item.action);
        cardsWrap.appendChild(card);
        allItems.push(card);
      });

      const sectionBar = document.createElement('div');
      sectionBar.className = 'chat-section-bar';
      sectionBar.onclick = function() { toggleChatSection(this); };
      sectionBar.innerHTML = '<span class="chat-section-bar-title">Menu</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

      const sectionBody = document.createElement('div');
      sectionBody.className = 'chat-section-body';
      sectionBody.appendChild(cardsWrap);

      const time = document.createElement('div');
      time.className = 'chat-time'; time.textContent = 'Now';

      wrapper.appendChild(sectionBar);
      wrapper.appendChild(sectionBody);
      wrapper.appendChild(time);
      messages.appendChild(wrapper);

      // Stagger animate in then scroll to kaiMsg
      allItems.forEach((el, i) => {
        setTimeout(() => {
          el.style.opacity = '';
          el.style.transform = '';
        }, 120 + i * 60);
      });

      const totalDelay = 120 + allItems.length * 60 + 100;
      setTimeout(() => {
        if (kaiMsg) {
          const msgsRect = messages.getBoundingClientRect();
          const msgRect = kaiMsg.getBoundingClientRect();
          messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
        }
      }, totalDelay);

    }, chatOpen ? 0 : 450);
  }

  // ── SETTINGS IN CHAT ────────────────────────────────────
  function addSettingsToChat() {
    if (!chatOpen) openChat();
    setTimeout(() => {
      const messages = document.getElementById('chat-messages');
      if (!messages) return;

      const kaiMsg = addChatMsg('acai', 'What would you like to manage?');

      const items = [
        { icon: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>', label: 'Profile', action: "sendChip('Show me my profile')" },
        { icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>', label: 'Usage', action: "sendChip('Show me my usage')" },
        { icon: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>', label: 'Billing', action: "sendChip('Show me my billing')" },
        { icon: '<rect x="2" y="3" width="6" height="6" rx="1"/><rect x="16" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M5 9v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><line x1="12" y1="12" x2="12" y2="15"/>', label: 'Connectors', action: "sendChip('Show me my connectors')" },
        { icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>', label: 'Agents', sub: 'Approvals · notifications', action: "sendChip('Show me agent controls')" },
        { icon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>', label: 'Preferences', sub: 'Theme and display options', action: "sendChip('Show me my preferences')" },
        { icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>', label: 'About', action: "openEduChat('about')" },
        { icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>', label: 'Legal', action: "sendChip('Show me legal')" },
        { icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>', label: 'Help', action: "sendChatWithIntent('I need help')" },
        { icon: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>', label: 'Sign Out', danger: true, action: "" },
      ];

      const wrapper = document.createElement('div');
      wrapper.className = 'chat-msg acai'; wrapper.dataset.type = 'settings';

      const cardsWrap = document.createElement('div');
      cardsWrap.style.cssText = 'display:flex;flex-direction:column;gap:12px;width:100%;margin-top:4px;';

      const allItems = [];

      items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'agent-card';
        card.style.cssText = 'opacity:0;transform:translateY(10px);transition:opacity 0.22s ease,transform 0.22s ease;cursor:pointer;';
        const stroke = item.danger ? '#FF453A' : 'rgba(255,255,255,0.8)';
        const titleColor = item.danger ? 'color:#FF453A;' : '';
        card.innerHTML = `
          <div class="agent-card-top" style="gap:14px;">
            <div class="stt-icon" style="flex-shrink:0;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg></div>
            <div style="flex:1;">
              <div class="agent-card-name" style="${titleColor}">${item.label}</div>
              ${item.sub ? `<div class="agent-card-preview" style="margin-top:2px;">${item.sub}</div>` : ''}
            </div>
            ${!item.danger ? '<svg class="stt-chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>' : ''}
          </div>`;
        if (item.action) {
          card.onclick = new Function(item.action);
        }
        cardsWrap.appendChild(card);
        allItems.push(card);
      });

      const sectionBar = document.createElement('div');
      sectionBar.className = 'chat-section-bar';
      sectionBar.onclick = function() { toggleChatSection(this); };
      sectionBar.innerHTML = '<span class="chat-section-bar-title">Settings</span><svg class="chat-section-bar-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

      const sectionBody = document.createElement('div');
      sectionBody.className = 'chat-section-body';
      sectionBody.appendChild(cardsWrap);

      const time = document.createElement('div');
      time.className = 'chat-time'; time.textContent = 'Now';

      wrapper.appendChild(sectionBar);
      wrapper.appendChild(sectionBody);
      wrapper.appendChild(time);
      messages.appendChild(wrapper);

      // Stagger animate in, then scroll to kaiMsg
      allItems.forEach((el, i) => {
        setTimeout(() => {
          el.style.opacity = '';
          el.style.transform = '';
        }, 120 + i * 60);
      });

      // Scroll after animation completes
      const totalDelay = 120 + allItems.length * 60 + 100;
      setTimeout(() => {
        if (kaiMsg) {
          const msgsRect = messages.getBoundingClientRect();
          const msgRect = kaiMsg.getBoundingClientRect();
          messages.scrollTop = messages.scrollTop + (msgRect.top - msgsRect.top) - 16;
        }
      }, totalDelay);

    }, chatOpen ? 0 : 450);
  }

  // ── DYNAMIC GREETING ─────────────────────────────────────
  (function() {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const el = document.getElementById('greeting-text');
    if (el) el.textContent = 'Good ' + timeOfDay + ', Tony';
  })();

