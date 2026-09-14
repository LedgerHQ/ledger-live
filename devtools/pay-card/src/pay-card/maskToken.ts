const VISIBLE_TOKEN_CHARS = 9;

export function maskToken(token: string): string {
  const visibleLength = Math.min(VISIBLE_TOKEN_CHARS, Math.max(0, token.length - 1));
  return `${token.slice(0, visibleLength)}…`;
}
