import { clippyApi } from "./clippyApi";

export async function createHermesSession(systemPrompt: string): Promise<void> {
  await clippyApi.hermesCreateSession(systemPrompt);
}

export async function* streamHermesChat(
  message: string,
  requestUUID: string,
): AsyncGenerator<string> {
  const chunks: string[] = [];
  let done = false;
  let errorMsg: string | null = null;
  let notify: (() => void) | null = null;

  const wake = () => {
    notify?.();
    notify = null;
  };

  // Remove any stale listeners from a previous request that didn't clean up
  clippyApi.offHermesChatListeners();

  clippyApi.onHermesChatChunk((uuid, chunk) => {
    if (uuid !== requestUUID) return;
    chunks.push(chunk);
    wake();
  });

  clippyApi.onHermesChatDone((uuid) => {
    if (uuid !== requestUUID) return;
    done = true;
    wake();
  });

  clippyApi.onHermesChatError((uuid, error) => {
    if (uuid !== requestUUID) return;
    errorMsg = error;
    wake();
  });

  // Kick off the SSE fetch in main — don't await it, chunks arrive as events.
  // Catch any up-front invoke errors (e.g. no active session) the same way.
  clippyApi.hermesStartStream(message, requestUUID).catch((err: unknown) => {
    errorMsg = String(err);
    wake();
  });

  try {
    while (true) {
      while (chunks.length > 0) {
        yield chunks.shift()!;
      }
      if (done) break;
      if (errorMsg) throw new Error(errorMsg);
      await new Promise<void>((resolve) => {
        notify = resolve;
      });
    }
    // Drain any chunks that arrived in the same tick as the done signal
    while (chunks.length > 0) {
      yield chunks.shift()!;
    }
  } finally {
    clippyApi.offHermesChatListeners();
  }
}

export function abortHermesRequest(requestUUID: string): void {
  clippyApi.hermesAbortRequest(requestUUID).catch(() => {});
}
