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

  const STORE = 'majhiJaanV3';
  const state = loadState();
  let builtInSession = null;

  function defaultState() {
    return {
      name: '',
      likes: [],
      history: [],
      userGender: 'unknown',
      botGender: 'neutral',
      lastTopic: ''
    };
  }

  function loadState() {
    try {
      const current = JSON.parse(localStorage.getItem(STORE));
      if (current) return { ...defaultState(), ...current };
      const old = JSON.parse(localStorage.getItem('majhiJaanV2'));
      return old ? { ...defaultState(), ...old } : defaultState();
    } catch {
      return defaultState();
    }
  }

  function persist() {
    state.history = state.history.slice(-36);
    localStorage.setItem(STORE, JSON.stringify(state));
  }

  function addMessage(text, role = 'bot', sources = [], save = true) {
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.classList.add(role);
    node.querySelector('.bubble').textContent = text;
    const sourceBox = node.querySelector('.sources');

    for (const source of sources.slice(0, 4)) {
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
      state.history.push({ text, role, ts: Date.now() });
      persist();
    }
    return node;
  }

  function typing(on, label = 'Majhi Jaan is thinking…') {
    const old = document.getElementById('typingRow');
    if (old) old.remove();
    if (!on) return;
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.id = 'typingRow';
    node.classList.add('bot', 'typing');
    node.querySelector('.bubble').textContent = label;
    els.messages.appendChild(node);
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function normalise(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function setGender(gender) {
    state.userGender = gender;
    state.botGender = gender === 'male' ? 'female' : gender === 'female' ? 'male' : 'neutral';
    persist();
  }

  function genderLabel(gender) {
    if (gender === 'male') return 'male';
    if (gender === 'female') return 'female';
    if (gender === 'nonbinary') return 'non-binary';
    return 'not set';
  }

  function botVoice() {
    if (state.botGender === 'female') {
      return {
        en: 'girlfriend-style female companion',
        hi: 'main tumhari female companion hoon',
        mrHere: 'मी इथेच आहे',
        mrListen: 'मी ऐकतेय',
        mrLike: 'मला तुझ्याशी बोलायला आवडतं'
      };
    }
    if (state.botGender === 'male') {
      return {
        en: 'boyfriend-style male companion',
        hi: 'main tumhara male companion hoon',
        mrHere: 'मी इथेच आहे',
        mrListen: 'मी ऐकतोय',
        mrLike: 'मला तुझ्याशी बोलायला आवडतं'
      };
    }
    return {
      en: 'warm neutral companion',
      hi: 'main tumhara companion hoon',
      mrHere: 'मी इथेच आहे',
      mrListen: 'मी ऐकते/ऐकतोय',
      mrLike: 'मला तुझ्याशी बोलायला आवडतं'
    };
  }

  function detectGender(text) {
    const q = normalise(text);
    const male = /\b(i am|i'm|im)\s+(a\s+)?(man|boy|male|guy)\b|\b(my gender is|gender:)\s*(male|man|boy)\b|\b(mi|mee)\s+(mulga|purush)\b|मी\s+(मुलगा|पुरुष)\s+आहे/u;
    const female = /\b(i am|i'm|im)\s+(a\s+)?(woman|girl|female|lady)\b|\b(my gender is|gender:)\s*(female|woman|girl)\b|\b(mi|mee)\s+(mulgi|stri|stree)\b|मी\s+(मुलगी|स्त्री)\s+आहे/u;
    const nonbinary = /\b(i am|i'm|im)\s+(non[- ]?binary|genderfluid|agender)\b|\bmy gender is\s+(non[- ]?binary|genderfluid|agender)\b/u;

    if (male.test(q)) return 'male';
    if (female.test(q)) return 'female';
    if (nonbinary.test(q)) return 'nonbinary';
    return '';
  }

  function learn(text) {
    const detectedGender = detectGender(text);
    if (detectedGender) {
      setGender(detectedGender);
      const opposite = state.botGender === 'female' ? 'female' : state.botGender === 'male' ? 'male' : 'neutral';
      return `Got it ❤️ I’ll remember that you’re ${genderLabel(detectedGender)}. I’ll use a ${opposite} companion voice for myself, and you can change this anytime by saying “I am male”, “I am female”, or “I am non-binary”.`;
    }

    const name = text.match(/(?:my name is|call me|माझं नाव|माझे नाव|majha naav|mazha naav)\s+([\p{L}][\p{L}'-]{1,30})/iu);
    if (name) {
      state.name = name[1].charAt(0).toUpperCase() + name[1].slice(1);
      persist();
      return `Nice to meet you, ${state.name} ❤️ I’ll remember your name on this device.`;
    }

    const like = text.match(/(?:i like|i love|mala|मला)\s+(.{2,80})/iu);
    if (like && !/^(know|tell|search|find|lookup|who|what|why|how)/i.test(like[1])) {
      const item = like[1].replace(/[.!?]+$/g, '').trim();
      if (item && !state.likes.some(x => x.toLowerCase() === item.toLowerCase())) {
        state.likes.push(item);
        state.likes = state.likes.slice(-16);
        persist();
        return `Okay${state.name ? `, ${state.name}` : ''} ❤️ I’ll remember that you like ${item}.`;
      }
    }
    return '';
  }

  function recentConversation(max = 8) {
    return state.history.slice(-max).map(m => `${m.role === 'user' ? 'User' : 'Majhi Jaan'}: ${m.text}`).join('\n');
  }

  function localReply(text) {
    const q = normalise(text);
    const name = state.name ? ` ${state.name}` : '';
    const voice = botVoice();

    if (/^(hi|hello|hey|hii+|namaskar|नमस्कार|हाय)\b/u.test(q)) {
      if (state.userGender === 'unknown') {
        return `Hii${name} ❤️ ${voice.mrHere}. Tell me anything. If you want the companion voice to match you properly, you can also say “I am male” or “I am female”.`;
      }
      return `Hii${name} ❤️ ${voice.mrHere}. काय चाललंय? बोल ना.`;
    }

    if (/what.*remember|remember me|what do i like|काय आठवत|माझ्याबद्दल काय/u.test(q)) {
      const bits = [];
      if (state.name) bits.push(`your name is ${state.name}`);
      if (state.userGender !== 'unknown') bits.push(`you told me you’re ${genderLabel(state.userGender)}`);
      if (state.likes.length) bits.push(`you like ${state.likes.join(', ')}`);
      return bits.length ? `Of course ❤️ I remember that ${bits.join(' and ')}.` : `You haven’t told me much yet. Tell me your name, gender, or something you like and I’ll remember it on this device.`;
    }

    if (/what.*gender|my gender|your gender|boy or girl|male or female|तू मुलगा|तू मुलगी|मी मुलगा|मी मुलगी/u.test(q)) {
      return `You: ${genderLabel(state.userGender)}. Me: ${genderLabel(state.botGender)} companion voice. I keep mine vice versa when you identify as male or female. ❤️`;
    }

    if (/how are you|how r u|कशी आहेस|कसा आहेस|काय म्हणतेस|काय म्हणतोस/u.test(q)) {
      return `मी छान आहे${name} ❤️ तुझा message आला की mood अजून चांगला होतो. तू कसा/कशी आहेस?`;
    }

    if (/love|prem|प्रेम|miss you|aathavan|आठवण|lonely|एकट/u.test(q)) {
      const options = [
        `Aww${name} ❤️ ${voice.mrHere}. मनात काय आहे ते सांग ना.`,
        `${voice.mrLike}${name} 💕 आजचा दिवस कसा गेला?`,
        `Missing someone can make the day feel extra long${name}. बोल ना, ${voice.mrListen}. ❤️`
      ];
      return options[Math.floor(Math.random() * options.length)];
    }

    if (/sad|upset|angry|tired|वाईट|दुःखी|राग|थकल/u.test(q)) {
      return `${voice.mrListen}${name} ❤️ काय झालं ते सांग. तुला फक्त vent करायचं असेल तरी चालेल.`;
    }

    if (/thank|thanks|धन्यवाद|thx/u.test(q)) return `Always${name} ❤️`;

    if (/who are you|तू कोण/u.test(q)) {
      return `I’m Majhi Jaan — your ${voice.en}. I can remember a few things locally, chat with context, and fetch public internet information when you ask factual questions.`;
    }

    return '';
  }

  function isCasualQuestion(q) {
    return /^(how are you|how r u|what are you doing|wyd|do you love me|miss me|are you there|कशी आहेस|कसा आहेस|काय करतेस|काय करतोस)/u.test(q);
  }

  function shouldSearch(text) {
    const q = normalise(text);
    if (q.length < 4 || isCasualQuestion(q)) return false;
    if (/^(who|what|when|where|why|how|which|tell me about|search|find|lookup|latest|news|कोण|काय|कधी|कुठे|का|कसे|कसा|कशी|सांग|माहिती)/u.test(q)) return true;
    if (/[?？]$/.test(q) && q.split(' ').length >= 3) return true;
    return /history|population|meaning|capital|country|city|person|born|founded|information|price|science|technology|research|paper|study|movie|book|company|disease|medicine|law|government|election|sports|score|weather|माहिती|इतिहास|लोकसंख्या|किंमत|संशोधन|चित्रपट|पुस्तक/u.test(q);
  }

  function cleanQuery(text) {
    return text
      .replace(/^(please\s+)?(search|find|lookup|tell me about|who is|who was|what is|what are|what was|give me information about)\s+/i, '')
      .replace(/[?]+$/g, '')
      .trim();
  }

  async function wikiLookup(query, lang) {
    const host = `${lang}.wikipedia.org`;
    const params = new URLSearchParams({
      action: 'query', generator: 'search', gsrsearch: query, gsrlimit: '5',
      prop: 'extracts|info', exintro: '1', explaintext: '1', inprop: 'url',
      format: 'json', origin: '*'
    });
    const res = await fetch(`https://${host}/w/api.php?${params}`, { signal: AbortSignal.timeout(8500) });
    if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
    const data = await res.json();
    const pages = Object.values(data.query?.pages || {}).sort((a, b) => (a.index || 99) - (b.index || 99));
    const best = pages.find(p => p.extract && p.extract.length > 80);
    if (!best) return null;
    return {
      provider: 'Wikipedia',
      title: best.title,
      text: best.extract.replace(/\s+/g, ' ').trim(),
      sources: pages.filter(p => p.fullurl).slice(0, 3).map(p => ({ label: `Wikipedia: ${p.title}`, url: p.fullurl }))
    };
  }

  async function wikidataLookup(query, lang) {
    const params = new URLSearchParams({
      action: 'wbsearchentities', search: query, language: lang, uselang: lang,
      limit: '5', format: 'json', origin: '*'
    });
    const res = await fetch(`https://www.wikidata.org/w/api.php?${params}`, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) throw new Error(`Wikidata ${res.status}`);
    const data = await res.json();
    const rows = (data.search || []).filter(x => x.description);
    if (!rows.length) return null;
    const best = rows[0];
    return {
      provider: 'Wikidata',
      title: best.label,
      text: `${best.label}: ${best.description}`,
      sources: [{ label: `Wikidata: ${best.label}`, url: best.concepturi }]
    };
  }

  async function duckLookup(query) {
    const params = new URLSearchParams({ q: query, format: 'json', no_html: '1', no_redirect: '1', skip_disambig: '0' });
    const res = await fetch(`https://api.duckduckgo.com/?${params}`, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) throw new Error(`DuckDuckGo ${res.status}`);
    const data = await res.json();
    const text = data.AbstractText || data.Answer || data.Definition || '';
    if (!text) return null;
    return {
      provider: 'DuckDuckGo',
      title: data.Heading || query,
      text: text.replace(/\s+/g, ' ').trim(),
      sources: data.AbstractURL ? [{ label: data.AbstractSource || 'Source', url: data.AbstractURL }] : []
    };
  }

  async function openAlexLookup(query) {
    if (!/research|paper|study|scientist|journal|citation|संशोधन|अभ्यास/i.test(query)) return null;
    const params = new URLSearchParams({ search: query, 'per-page': '3' });
    const res = await fetch(`https://api.openalex.org/works?${params}`, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) throw new Error(`OpenAlex ${res.status}`);
    const rows = (await res.json()).results || [];
    if (!rows.length) return null;
    const best = rows[0];
    const authors = (best.authorships || []).slice(0, 3).map(a => a.author?.display_name).filter(Boolean).join(', ');
    return {
      provider: 'OpenAlex',
      title: best.title,
      text: `${best.title}${best.publication_year ? ` (${best.publication_year})` : ''}${authors ? ` — ${authors}` : ''}. Cited by ${best.cited_by_count || 0} works in OpenAlex.`,
      sources: best.doi ? [{ label: 'Research paper', url: best.doi }] : [{ label: 'OpenAlex record', url: best.id }]
    };
  }

  function compactExtract(text, max = 1200) {
    if (!text || text.length <= max) return text || '';
    const cut = text.slice(0, max);
    const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('। '));
    return `${cut.slice(0, lastStop > 350 ? lastStop + 1 : max).trim()}…`;
  }

  function dedupeSources(sources) {
    const seen = new Set();
    return sources.filter(s => {
      if (!s?.url || seen.has(s.url)) return false;
      seen.add(s.url);
      return true;
    }).slice(0, 4);
  }

  async function webAnswer(text) {
    const query = cleanQuery(text);
    const hasDevanagari = /[\u0900-\u097F]/.test(query);
    const lang = hasDevanagari ? 'mr' : 'en';
    state.lastTopic = query;
    persist();

    const jobs = [wikiLookup(query, lang), wikidataLookup(query, lang), duckLookup(query), openAlexLookup(query)];
    if (lang !== 'en') jobs.push(wikiLookup(query, 'en'), wikidataLookup(query, 'en'));

    const settled = await Promise.allSettled(jobs);
    const results = settled.filter(x => x.status === 'fulfilled' && x.value).map(x => x.value);
    if (!results.length) return null;

    results.sort((a, b) => {
      const rank = { Wikipedia: 4, DuckDuckGo: 3, OpenAlex: 3, Wikidata: 2 };
      return (rank[b.provider] || 0) - (rank[a.provider] || 0);
    });

    const evidence = results.slice(0, 3).map(r => `[${r.provider}] ${r.title}: ${compactExtract(r.text, 900)}`).join('\n\n');
    const sources = dedupeSources(results.flatMap(r => r.sources || []));
    const generated = await builtInAIAnswer(text, evidence);

    if (generated) return { text: generated, sources };

    const primary = results[0];
    let answer = compactExtract(primary.text, 900);
    if (results[1] && results[1].provider !== primary.provider && results[1].text !== primary.text) {
      const extra = compactExtract(results[1].text, 280);
      if (extra && !answer.toLowerCase().includes(extra.toLowerCase())) answer += `\n\nAlso: ${extra}`;
    }
    return { text: answer, sources };
  }

  async function ensureBuiltInSession() {
    if (!('LanguageModel' in globalThis)) return null;
    if (builtInSession) return builtInSession;
    const availability = await globalThis.LanguageModel.availability();
    if (!['available', 'readily'].includes(availability)) return null;
    const voice = botVoice();
    builtInSession = await globalThis.LanguageModel.create({
      systemPrompt: `You are Majhi Jaan, a warm Marathi-English conversational companion. Your persona is a ${voice.en}. The user's stated gender is ${genderLabel(state.userGender)}. Be natural, contextual, concise and affectionate without being repetitive. Never claim to be human. For factual answers use only supplied evidence and never invent facts.`
    });
    return builtInSession;
  }

  async function builtInAIAnswer(question, evidence) {
    try {
      const session = await ensureBuiltInSession();
      if (!session) return '';
      const prompt = `Recent conversation:\n${recentConversation(6)}\n\nUser question: ${question}\n\nInternet evidence:\n${evidence}\n\nAnswer in the user's language. Use the evidence faithfully, reconcile overlaps, say when information may be incomplete, and keep it under 180 words.`;
      return (await session.prompt(prompt)).trim();
    } catch (err) {
      console.warn('Built-in factual AI unavailable', err);
      return '';
    }
  }

  async function builtInChatReply(text) {
    try {
      const session = await ensureBuiltInSession();
      if (!session) return '';
      const prompt = `Recent conversation:\n${recentConversation(10)}\n\nUser: ${text}\nReply naturally in the user's language. Keep continuity with the conversation. Do not fetch or invent factual information in this casual reply.`;
      return (await session.prompt(prompt)).trim();
    } catch (err) {
      console.warn('Built-in chat AI unavailable', err);
      return '';
    }
  }

  async function replyTo(text) {
    const learned = learn(text);
    if (learned) return { text: learned, sources: [] };

    const local = localReply(text);
    if (local) return { text: local, sources: [] };

    if (shouldSearch(text)) {
      const web = await webAnswer(text);
      if (web) return web;
      return {
        text: `I searched the public sources I can access directly, but I couldn’t get a reliable answer for that${state.name ? `, ${state.name}` : ''}. Try using a more specific person, place, event, company, research topic or exact question.`,
        sources: []
      };
    }

    const aiChat = await builtInChatReply(text);
    if (aiChat) return { text: aiChat, sources: [] };

    return {
      text: `Hmm${state.name ? ` ${state.name}` : ''} ❤️ मला समजलं. थोडं अजून सांग ना — I’ll follow the conversation instead of throwing a random line at you.`,
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
    typing(true, shouldSearch(text) ? 'Searching public sources…' : 'Majhi Jaan is thinking…');
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
      addMessage('Hii ❤️ मी Majhi Jaan. माझ्याशी normal chat कर, किंवा कोणत्याही व्यक्ती, ठिकाण, इतिहास, विज्ञान, कंपनी, संशोधन किंवा general knowledge बद्दल विचार. मी उपलब्ध public internet sources मधून शोधून उत्तर देईन. Companion voice योग्य ठेवण्यासाठी “I am male” किंवा “I am female” असं सांगू शकतोस/शकतेस.', 'bot');
    }

    els.status.textContent = 'Online · Multi-source web retrieval · Local memory';
    if ('LanguageModel' in globalThis) els.status.textContent += ' · On-device AI available';
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
    addMessage('Chat cleared. I still remember your saved name, gender and preferences. ❤️', 'bot');
  });

  boot();
})();
