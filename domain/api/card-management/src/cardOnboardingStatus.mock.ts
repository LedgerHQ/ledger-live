import type {
  PayCardInternalWallet,
  PayCardLinkedWalletResponse,
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

/**
 * The wallets both answers describe, every one of them linked to the card.
 *
 * Three rather than one, on three chains: the balance screen joins the two answers and prices each
 * row on its own, so a single wallet left the sum, the ordering and an unpriced row untested. Each
 * pair is one the asset catalog covers, so a mocked row resolves to a currency like a real one.
 */
const MOCK_WALLETS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    currency: "usdc",
    network: "ethereum",
    address: "0x0000000000000000000000000000000000000000",
    balance: "125.40",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    currency: "btc",
    network: "bitcoin",
    address: "bc1qmockwalletaddressmockwalletaddressmock0",
    balance: "0.00432100",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    currency: "sol",
    network: "solana",
    address: "SoLMockWa11etAddre55MockWa11etAddre55Moc",
    balance: "12.500000000",
  },
] as const;

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

/** The join keys balances to linked wallets by id, so both answers describe the same wallets. */
export function mockPayCardInternalWallets(funded: boolean): readonly PayCardInternalWallet[] {
  return MOCK_WALLETS.map(({ id, currency, address, balance }) => ({
    id,
    // Emptied rather than dropped: an unfunded card still has its wallets, they just hold nothing.
    balance: funded ? balance : "0.00",
    currency,
    address,
    addressMemo: null,
  }));
}

/** Every mocked wallet is linked, in the order they were listed, so the join finds all of them. */
export function mockPayCardLinkedWallets(): readonly PayCardLinkedWalletResponse[] {
  return MOCK_WALLETS.map(({ id, address, currency, network }, index) => ({
    id,
    address,
    currency,
    network,
    priority: index,
  }));
}
