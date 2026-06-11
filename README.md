# clippy-hermes

A fork of [felixrieseberg/clippy](https://github.com/felixrieseberg/clippy) with the local LLM backend replaced by a self-hosted [Hermes](https://github.com/R3PC0N/hermes) agent API.

The Clippy UI, animations, and retro Windows 98 aesthetic are completely unchanged. What changed is where the intelligence comes from: instead of running a model in-process with node-llama-cpp, all inference goes through HTTP to a Hermes instance running on my homelab.

## What is Hermes?

Hermes is a self-hosted agent framework. It exposes a session-based HTTP API: you create a session (with a system prompt), then stream chat messages over SSE. Clippy communicates with it over the local network.

## How it works

1. On startup, the chat window calls `POST /api/sessions` to create a Hermes session with the configured system prompt.
2. Each user message is sent as `POST /api/sessions/{id}/chat/stream`.
3. The server responds with SSE events (`assistant.delta` for content chunks, `done` to signal completion).
4. Chunks stream into the chat window in real time. The model can prefix its response with an animation tag like `[Wave]` to trigger a Clippy animation.

All HTTP calls run in the Electron main process to avoid CORS restrictions. The renderer communicates with main via IPC.

## Setup

### Prerequisites

- A running Hermes instance on your network
- An API key

### Configuration

**1. API key**

Create `~/.hermes/.env` with your API key:

```
API_SERVER_KEY=your-key-here
```

**2. Server URL**

Edit `src/main/hermesClient.ts` and set `BASE_URL` to your Hermes server:

```typescript
const BASE_URL = "http://192.168.x.x:8642";
```

**3. Install and run**

```bash
npm install
npm start
```

## Architecture notes

- **`src/main/hermesClient.ts`** — HTTP client (session creation, SSE streaming, abort)
- **`src/renderer/hermesApi.ts`** — Converts IPC events into an `AsyncGenerator<string>` for the chat component
- **`src/renderer/components/ChatApp.tsx`** — Root component for the chat window (separate `BrowserWindow` created from main, loaded at `index.html#chat`)
- The chat window and Clippy character window are separate `BrowserWindow` instances. Animation triggers are forwarded from the chat window to the main window over IPC.

## Acknowledgements

- **[Felix Rieseberg](https://github.com/felixrieseberg)** for the original [Clippy](https://felixrieseberg.github.io/clippy/) app — the UI, animations, chat interface, and Windows 98 aesthetic are entirely his work.
- **[Kevan Atteberry](https://www.kevanatteberry.com/)** for designing the Clippy character
- **[Jordan Scales (@jdan)](https://github.com/jdan)** for the Windows 98 CSS
- **[Pooya Parsa (@pi0)](https://github.com/pi0)** for extracting Clippy's animation frame lengths
- **[node-llama-cpp](https://github.com/withcatai/node-llama-cpp)** — used in the upstream project, removed here

## License

MIT. See [LICENSE](LICENSE).

The Clippy character is a trademark of Microsoft Corporation. This project is not affiliated with, endorsed by, or supported by Microsoft. The character is used here as software art/satire in the spirit of the original project.
