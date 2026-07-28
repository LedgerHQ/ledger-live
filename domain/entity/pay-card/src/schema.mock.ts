import type { PayCardPreAuth, PayCardSession, PayCardUser } from "./types";

export function makePayCardPreAuth(overrides: Partial<PayCardPreAuth> = {}): PayCardPreAuth {
  return {
    loginUrl: "https://card-mock.ledger-test.com/hosted-ui",
    ...overrides,
  };
}

export function makePayCardSession(overrides: Partial<PayCardSession> = {}): PayCardSession {
  return {
    appSessionToken: "cs_mock_card_session_token",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

export function makePayCardUser(overrides: Partial<PayCardUser> = {}): PayCardUser {
  return {
    verificationState: "VERIFIED",
    cardStatus: "ACTIVE",
    cardFunded: true,
    addedToDigitalWallet: false,
    hasFirstTransaction: false,
    ...overrides,
  };
}
