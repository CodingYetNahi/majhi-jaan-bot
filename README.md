# Majhi Jaan Bot

A responsive Marathi-friendly browser chatbot hosted on GitHub Pages.

## What it does

- Mobile-first chat UI for iPhone, Android and desktop
- Local on-device memory for name, likes and recent conversation
- Public internet lookup through Wikipedia/Wikimedia endpoints with source links
- Optional use of a browser's built-in on-device `LanguageModel` when the browser provides it
- No API key, login, paid AI provider, backend or secret required
- Safe text rendering instead of inserting user messages as HTML

## Important limitation

GitHub Pages is static hosting. It cannot safely store private AI credentials and it cannot run a server-side model. On browsers without a built-in language model, Majhi Jaan uses local conversation logic plus public web retrieval rather than pretending to be a full generative LLM.

## Privacy

Conversation memory is stored in the browser's `localStorage` on the user's device. Public factual queries are sent to Wikipedia for retrieval.
