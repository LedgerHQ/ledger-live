import type { Envelope, MessageMap } from "./types";

export function createEnvelope<M extends MessageMap, K extends keyof M>(
  origin: string,
  seq: number,
  kind: K,
  payload: M[K],
): Envelope<M, K> {
  const ts = Date.now();
  return { id: `${origin}-${ts}-${seq}`, seq, ts, origin, kind, payload };
}

export function encodeMessage<M extends MessageMap, K extends keyof M>(
  origin: string,
  seq: number,
  kind: K,
  payload: M[K],
): string {
  return JSON.stringify(createEnvelope<M, K>(origin, seq, kind, payload));
}
