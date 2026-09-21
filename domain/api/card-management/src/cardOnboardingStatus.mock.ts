import type {
  PayCardInternalWallet,
  PayCardLinkedWallet,
  PayCardStatus,
  PayCardUser,
} from "./types";

/**
 * What the Card endpoints should answer, so onboarding can be put into a given state.
 *
 * Onboarding is worked out from several endpoints rather than fetched, so a step is only reachable
 * through the answer behind it. These are the answers, one per step a request can decide.
 *
 * An answer left unset is not mocked at all: the request reaches the provider. Setting one pins
 * that endpoint until it is cleared, so a tester can hold one step and leave the rest real.
 */
export type CardOnboardingStatusMock = {
  /** `GET /v1/user`: whether the account reads as verified. */
  readonly accountVerified?: boolean;
  /** `GET /v1/card/status`: whether a card is answered with at all. */
  readonly hasCard?: boolean;
  /** `GET /v1/wallet/internal(/card_linked)`: whether the linked wallet holds anything. */
  readonly walletFunded?: boolean;
};

let answers: CardOnboardingStatusMock = {};

/** Read by the host's MSW handlers, on every request they answer. */
export function readCardOnboardingStatusMock(): CardOnboardingStatusMock {
  return answers;
}

/** Written by the devtool. Pass `undefined` to hand the endpoint back to the provider. */
export function setCardOnboardingStatusMock<Key extends keyof CardOnboardingStatusMock>(
  key: Key,
  value: CardOnboardingStatusMock[Key],
): void {
  const next = { ...answers };

  if (value === undefined) {
    // Removed rather than set to `undefined`, so a present key always means a mocked endpoint.
    delete next[key];
  } else {
    next[key] = value;
  }

  answers = next;
}

/** Drops every answer, so all four endpoints answer from the provider again. */
export function clearCardOnboardingStatusMock(): void {
  answers = {};
}

const MOCK_WALLET_ID = "11111111-1111-4111-8111-111111111111";

export function mockPayCardUser(verified: boolean): PayCardUser {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    verificationState: verified ? "VERIFIED" : "PENDING",
  };
}

export function mockPayCardStatus(): PayCardStatus {
  return {
    id: "card-mock",
    holderName: "Mock Holder",
    expiryDate: "2030/01",
    panLast4: "4242",
    status: "ACTIVE",
    type: "VIRTUAL",
    orderedAt: "2026-01-01T00:00:00.000Z",
  };
}

/** The join keys balances to linked wallets by id, so both answers describe the same wallet. */
export function mockPayCardInternalWallets(funded: boolean): readonly PayCardInternalWallet[] {
  return [
    {
      id: MOCK_WALLET_ID,
      balance: funded ? "125.40" : "0.00",
      currency: "usdc",
      address: "0x0000000000000000000000000000000000000000",
      addressMemo: null,
    },
  ];
}

export function mockPayCardLinkedWallets(): readonly PayCardLinkedWallet[] {
  return [
    {
      id: MOCK_WALLET_ID,
      address: "0x0000000000000000000000000000000000000000",
      currency: "usdc",
      network: "ethereum",
      priority: 1,
    },
  ];
}
