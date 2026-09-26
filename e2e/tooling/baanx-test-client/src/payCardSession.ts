import type { BaanxAuthSession } from "./types";

export const CARD_SESSION_BOOTSTRAP_ENV = "CARD_SESSION_BOOTSTRAP";

export const REFRESH_TOKEN_PLACEHOLDER = "no-refresh-token-from-password-login";

export function toPayCardSessionJson(session: BaanxAuthSession): string {
  const expiresIn = Math.max(
    1,
    Math.floor((Date.parse(session.expiresAt) - Date.parse(session.issuedAt)) / 1000),
  );

  return JSON.stringify({
    accessToken: session.accessToken,
    refreshToken: REFRESH_TOKEN_PLACEHOLDER,
    expiresIn,
  });
}
