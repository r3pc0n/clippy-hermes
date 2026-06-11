import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const BASE_URL = "http://192.168.2.41:8642";
const MODEL_ID = "hermes-agent";

let activeSessionId: string | null = null;
const abortControllers = new Map<string, AbortController>();

function readApiKey(): string {
  const envPath = path.join(os.homedir(), ".hermes", ".env");
  let content: string;

  try {
    content = fs.readFileSync(envPath, "utf-8");
  } catch (cause) {
    throw new Error(`Cannot read ~/.hermes/.env: ${cause}`);
  }

  const match = content.match(/^API_SERVER_KEY=(.+)$/m);
  if (!match) {
    throw new Error("API_SERVER_KEY not found in ~/.hermes/.env");
  }

  return match[1].trim();
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${readApiKey()}`,
  };
}

export async function createSession(systemPrompt: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/api/sessions`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ model: MODEL_ID, system_prompt: systemPrompt }),
    });
  } catch (cause) {
    console.error("[hermesClient] createSession fetch failed:", cause);
    throw cause;
  }

  if (!response.ok) {
    const err = new Error(
      `Hermes session creation failed: ${response.status} ${response.statusText}`,
    );
    console.error("[hermesClient] createSession bad status:", err.message);
    throw err;
  }

  const data = (await response.json()) as { session: { id: string } };
  activeSessionId = data.session.id;
  return data.session.id;
}

export function getActiveSessionId(): string | null {
  return activeSessionId;
}

export async function streamChat(
  message: string,
  requestUUID: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
): Promise<void> {
  if (!activeSessionId) {
    onError("No active Hermes session — call createSession first.");
    return;
  }

  const url = `${BASE_URL}/api/sessions/${activeSessionId}/chat/stream`;
  const controller = new AbortController();
  abortControllers.set(requestUUID, controller);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Hermes chat stream failed: ${response.status} ${response.statusText}`,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Response body is null");

    const decoder = new TextDecoder();
    let buffer = "";
    let currentEvent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
          continue;
        }

        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();

        if (currentEvent === "done") {
          onDone();
          return;
        }

        if (currentEvent === "assistant.delta") {
          try {
            const parsed = JSON.parse(payload);
            if (typeof parsed.delta === "string" && parsed.delta.length > 0) {
              onChunk(parsed.delta);
            }
          } catch {
            // skip malformed SSE frames
          }
        }

        currentEvent = "";
      }
    }

    // Stream ended without an explicit done event
    onDone();
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      onDone();
    } else {
      onError(String(error));
    }
  } finally {
    abortControllers.delete(requestUUID);
  }
}

export function abortRequest(requestUUID: string): void {
  abortControllers.get(requestUUID)?.abort();
  abortControllers.delete(requestUUID);
}
