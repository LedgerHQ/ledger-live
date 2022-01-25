export const cla = "e1";
export const p1p2 = "0000";
export const ok = "9000";
export const resp = "<= ";
export const comm = "=> ";

export function h(n: number, padding: number = 1): string {
  const base = n.toString(16);
  if (padding > 0) {
    return base.padStart(padding * 2, "0");
  }
  return base;
}

export function ascii(s: string): string {
  return Buffer.from(s, "ascii").toString("hex");
}

export function statusResponse(code: number): string {
  return resp + h(code, 2);
}

export function asciiResponse(data: string): string {
  return resp + ascii(data) + ok;
}