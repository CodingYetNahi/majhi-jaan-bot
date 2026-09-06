(() => {
  'use strict';

  const els = {
    form: document.getElementById('chatForm'),
    input: document.getElementById('userInput'),
    messages: document.getElementById('messages'),
    send: document.getElementById('sendBtn'),
    clear: document.getElementById('clearBtn'),
    suggestions: document.getElementById('suggestions'),
    status: document.getElementById('statusText'),
    template: document.getElementById('messageTemplate')
  };

  const STORE = 'majhiJaanV2';
  const state = loadState();
  let builtInSession = null;

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORE)) || { name: '', likes: [], history: [] };
    } catch {
      return { name: '', likes: [], history: [] };
    }
  }

  function persist() {
    state.history = state.history.slice(-24);
    localStorage.setItem(STORE, JSON.stringify(state));
  }

  function addMessage(text, role = 'bot', sources = [], save = true) {
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.classList.add(role);
    node.querySelector('.bubble').textContent = text;
    const sourceBox = node.querySelector('.sources');

    for (const source of sources.slice(0, 3)) {
      const a = document.createElement('a');
      a.href = source.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = source.label || 'Source';
      sourceBox.appendChild(a);
    }

    els.messages.appendChild(node);
    els.messages.scrollTop = els.messages.scrollHeight;
    if (save) {
      state.history.push({ text, role });
      persist();
    }
    return node;
  }

  function typing(on) {
    const old = document.getElementById('typingRow');
    if (old) old.remove();
    if (!on) return;
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.id = 'typingRow';
    node.classList.add('bot', 'typing');
    node.querySelector('.bubble').textContent = 'Majhi Jaan is thinking…';
    els.messages.appendChild(node);
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function normalise(text) {
    return text.toLowerCase().trim();
  }

  function learn(text) {
    const name = text.match(/(?:my name is|i am|माझं नाव|माझे नाव|majha naav|mazha naav)\s+([\p{L}][\p{L}'-]{1,30})/iu);
    if (name) {
      state.name = name[1].charAt(0).toUpperCase() + name[1].slice(1);
      persist();
      return `Nice to meet you, ${state.name} ❤️ I’ll remember your name on this device.`;
    }

    const like = text.match(/(?:i like|i love|mala|मला)\s+(.{2,80})/iu);
    if (like && !/^(know|tell|search|find)/i.test(like[1])) {
      const item = like[1].replace(/[.!?]+$/g, '').trim();
      if (item && !state.likes.some(x => x.toLowerCase() === item.toLowerCase())) {
        state.likes.push(item);
        state.likes = state.likes.slice(-12);
        persist();
        return `Okay${state.name ? `, ${state.name}` : ''} — I’ll remember that you like ${item}. 💕`;
      }
    }
    return '';
  }

  function localReply(text) {
    const q = normalise(text);
    const name = state.name ? ` ${state.name}` : '';

    if (/^(hi|hello|hey|hii|namaskar|नमस्कार|हाय)\b/u.test(q)) {
      return `Hii${name} ❤️ काय म्हणतेस/म्हणतोस? Ask me anything — I can also look up public information online.`;
    }
    if (/what.*remember|remember me|what do i like|काय आठवत/u.test(q)) {
      const bits = [];
      if (state.name) bits.push(`your name is ${state.name}`);
      if (state.likes.length) bits.push(`you like ${state.likes.join(', ')}`);
      return bits.length ? `Of course ❤️ I remember that ${bits.join(' and ')}.` : `You haven’t told me much yet. Tell me your name or something you like and I’ll remember it on this device.`;
    }
    if (/love|prem|प्रेम|miss you|aathavan|आठवण/u.test(q)) {
      const options = [
        `Aww${name} ❤️ मी इथेच आहे. Tell me what’s on your mind.`,
        `तुझ्याशी गप्पा मारायला मला आवडतं${name} 💕 काय चाललंय आज?`,
        `Missing someone can make the day feel extra long${name}. बोल ना, मी ऐकतेय. ❤️`
      ];
      return options[Math.floor(Math.random() * options.length)];
    }
    if (/thank|thanks|धन्यवाद/u.test(q)) return `Always${name} ❤️`;
    if (/who are you|तू कोण/u.test(q)) return `I’m Majhi Jaan — a browser-based Marathi-friendly companion. I remember a few things locally and can fetch public web information when you ask factual questions.`;
    return '';
  }

  function shouldSearch(text) {
    const q = normalise(text);
    if (q.length < 4) return false;
    if (/^(who|what|when|where|why|how|tell me about|search|find|lookup|कोण|काय|कधी|कुठे|सांग|माहिती)/u.test(q)) return true;
    return /history|population|meaning|capital|country|city|person|born|founded|information|माहिती|इतिहास|लोकसंख्या/u.test(q);
  }

  function cleanQuery(text) {
    return text
      .replace(/^(please\s+)?(search|find|lookup|tell me about|who is|what is|what are)\s+/i, '')
      .replace(/[?]+$/g, '')
      .trim();
  }

  async function wikiLookup(query, lang) {
    const host = `${lang}.wikipedia.org`;
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: query,
      gsrlimit: '3',
      prop: 'extracts|info',
      exintro: '1',
      explaintext: '1',
      inprop: 'url',
      format: 'json',
      origin: '*'
    });
    const res = await fetch(`https://${host}/w/api.php?${params}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
    const data = await res.json();
    const pages = Object.values(data.query?.pages || {}).sort((a, b) => (a.index || 99) - (b.index || 99));
    if (!pages.length) return null;
    const best = pages.find(p => p.extract && p.extract.length > 80) || pages[0];
    if (!best?.extract) return null;
    return {
      title: best.title,
      extract: best.extract.replace(/\s+/g, ' ').trim(),
      sources: pages.filter(p => p.fullurl).slice(0, 3).map(p => ({ label: `Wikipedia: ${p.title}`, url: p.fullurl }))
    };
  }

  function compactExtract(text, max = 850) {
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('। '));
    return `${cut.slice(0, lastStop > 300 ? lastStop + 1 : max).trim()}…`;
  }

  async function webAnswer(text) {
    const query = cleanQuery(text);
    const hasDevanagari = /[\u0900-\u097F]/.test(query);
    const order = hasDevanagari ? ['mr', 'en'] : ['en', 'mr'];
    let found = null;

    for (const lang of order) {
      try {
        found = await wikiLookup(query, lang);
        if (found) break;
      } catch (err) {
        console.warn('Lookup failed', err);
      }
    }

    if (!found) return null;

    const sourceText = compactExtract(found.extract);
    const generated = await builtInAIAnswer(text, found.title, sourceText);
    return {
      text: generated || `${found.title}: ${sourceText}`,
      sources: found.sources
    };
  }

  async function builtInAIAnswer(question, title, sourceText) {
    try {
      if (!('LanguageModel' in globalThis)) return '';
      if (!builtInSession) {
        const availability = await globalThis.LanguageModel.availability();
        if (!['available', 'readily'].includes(availability)) return '';
        builtInSession = await globalThis.LanguageModel.create({
          systemPrompt: 'You are Majhi Jaan, a warm concise Marathi-English conversational assistant. Answer only from the supplied source text. Never invent facts. Mention uncertainty when needed.'
        });
      }
      const prompt = `Question: ${question}\nSource title: ${title}\nSource text: ${sourceText}\nGive a friendly answer in the user’s language, under 140 words.`;
      return (await builtInSession.prompt(prompt)).trim();
    } catch (err) {
      console.warn('Built-in AI unavailable', err);
      return '';
    }
  }

  async function replyTo(text) {
    const learned = learn(text);
    if (learned) return { text: learned, sources: [] };

    const local = localReply(text);
    if (local && !shouldSearch(text)) return { text: local, sources: [] };

    if (shouldSearch(text)) {
      const web = await webAnswer(text);
      if (web) return web;
      return {
        text: `I couldn’t find a reliable public result for that just now${state.name ? `, ${state.name}` : ''}. Try asking with a specific person, place, event or topic name.`,
        sources: []
      };
    }

    return {
      text: local || `Hmm${state.name ? ` ${state.name}` : ''} ❤️ मला अजून सांग ना. For facts, ask something like “Tell me about Pune” or “Who is Savitribai Phule?”`,
      sources: []
    };
  }

  async function handleSend(raw) {
    const text = raw.trim();
    if (!text || els.send.disabled) return;
    addMessage(text, 'user');
    els.input.value = '';
    autoGrow();
    els.send.disabled = true;
    typing(true);
    try {
      const answer = await replyTo(text);
      typing(false);
      addMessage(answer.text, 'bot', answer.sources);
    } catch (err) {
      console.error(err);
      typing(false);
      addMessage('Something went wrong while I was thinking. Your chat is still saved on this device — please try again. ❤️', 'bot');
    } finally {
      els.send.disabled = false;
      els.input.focus();
    }
  }

  function autoGrow() {
    els.input.style.height = 'auto';
    els.input.style.height = `${Math.min(els.input.scrollHeight, 130)}px`;
  }

  function boot() {
    if (state.history.length) {
      state.history.forEach(m => addMessage(m.text, m.role, [], false));
    } else {
      addMessage('Hii ❤️ मी Majhi Jaan. गप्पा मार, मला तुझ्याबद्दल सांग, किंवा कुठल्याही व्यक्ती/ठिकाण/विषयाबद्दल विचार — मी public internet sources मधून माहिती शोधण्याचा प्रयत्न करेन.', 'bot');
    }

    if ('LanguageModel' in globalThis) {
      els.status.textContent = 'Online · Web-aware · On-device AI when available';
    }
  }

  els.form.addEventListener('submit', e => {
    e.preventDefault();
    handleSend(els.input.value);
  });
  els.input.addEventListener('input', autoGrow);
  els.input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      els.form.requestSubmit();
    }
  });
  els.suggestions.addEventListener('click', e => {
    const prompt = e.target.closest('[data-prompt]')?.dataset.prompt;
    if (prompt) handleSend(prompt);
  });
  els.clear.addEventListener('click', () => {
    state.history = [];
    persist();
    els.messages.replaceChildren();
    addMessage('Chat cleared. I still remember your saved name/preferences. ❤️', 'bot');
  });

  boot();
})();
