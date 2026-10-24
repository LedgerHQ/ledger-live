/** toncenter's v2 API (ton-http-api-cpp) over the local lite-server, as published by docker-compose.yml. */
export const TON_HTTP_API_URL = "http://127.0.0.1:18082/api/v2";

type Envelope<T> = { ok: true; result: T } | { ok: false; error: string; code: number };

async function unwrap<T>(method: string, response: Response): Promise<T> {
  const envelope = (await response.json()) as Envelope<T>;
  if (!envelope.ok) {
    throw new Error(`ton-http-api ${method} failed (${envelope.code}): ${envelope.error}`);
  }
  return envelope.result;
}

export async function v2Get<T>(
  method: string,
  params: Record<string, string | number>,
): Promise<T> {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );
  return unwrap<T>(method, await fetch(`${TON_HTTP_API_URL}/${method}?${query}`));
}

export async function v2Post<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${TON_HTTP_API_URL}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return unwrap<T>(method, response);
}

/** Unset for an undeployed wallet. */
export type WalletInformation = { seqno?: number };
