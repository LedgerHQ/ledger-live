import axios from "axios";

export function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export async function preflightApdu(baseUrl: string, overallMs: number) {
  const deadline = Date.now() + overallMs;
  let lastErr: unknown;
  while (Date.now() < deadline) {
    const ac = new AbortController();
    const perTry = 1200;
    const killer = setTimeout(() => ac.abort(), perTry);
    try {
      await axios.post(
        `${baseUrl}/apdu`,
        { data: "B0010000" },
        {
          timeout: perTry,
          signal: ac.signal,
          headers: { "X-Ledger-Client-Version": "ldmk-speculos/preflight", Connection: "close" },
          transitional: { clarifyTimeoutError: true },
        },
      );
      clearTimeout(killer);
      return;
    } catch (e) {
      clearTimeout(killer);
      lastErr = e;
      await sleep(200);
    }
  }
  throw new Error(`Speculos /apdu not ready within ${overallMs}ms: ${String(lastErr)}`);
}

export function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      v => {
        clearTimeout(t);
        resolve(v);
      },
      e => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}
