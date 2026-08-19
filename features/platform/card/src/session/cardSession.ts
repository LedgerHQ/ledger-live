/** In-memory only — never persisted. */
let currentToken: string | null = null;

export const cardSession = {
  set(token: string | null | undefined): void {
    currentToken = token ?? null;
  },
  clear(): void {
    currentToken = null;
  },
  getToken(): string | null {
    return currentToken;
  },
};

export function getCardSessionToken(): string | null | undefined {
  return cardSession.getToken();
}

/** No refresh token yet — clears the session. */
export async function refreshCardSession(): Promise<string | null | undefined> {
  cardSession.clear();
  return null;
}
