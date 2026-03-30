import { http, HttpResponse } from "msw";

/** Devnet gateway — must match LLC defaults for `canton_network_devnet` and integ test coinConfig. */
export const CANTON_DEVNET_GATEWAY = "https://canton-gateway-devnet.api.live.ledger-test.com";
export const CANTON_DEVNET_NODE_ID = "ledger-live-devnet";

export const MOCK_ONBOARD_PARTY_ID = "mock-party-onboard-integ";

/** Hex public key (64 chars); must match `getAddress` mock in canton onboard integ test. */
export const MOCK_CANTON_PUBLIC_KEY_HEX = "aa".repeat(32);

const emptyTx = (serialized: string) => ({
  serialized,
  transaction: { operation: "noop", serial: 0, mapping: {} as Record<string, unknown> },
  hash: "00".repeat(32),
});

const defaultPrepareResponse = {
  party_id: MOCK_ONBOARD_PARTY_ID,
  party_name: "Mock Party",
  public_key_fingerprint: "fingerprint",
  transactions: {
    namespace_transaction: emptyTx("00".repeat(32)),
    party_to_key_transaction: emptyTx("11".repeat(32)),
    party_to_participant_transaction: emptyTx("22".repeat(32)),
    combined_hash: "33".repeat(32),
  },
};

const basePath = `${CANTON_DEVNET_GATEWAY}/v1/node/${CANTON_DEVNET_NODE_ID}`;

export const cantonOnboardingPrepareUrl = `${basePath}/onboarding/prepare`;

const handlers = [
  http.get(`${basePath}/party/:_identifier`, () =>
    HttpResponse.json({ message: "not found" }, { status: 404 }),
  ),
  http.post(`${basePath}/onboarding/prepare`, () => HttpResponse.json(defaultPrepareResponse)),
  http.post(`${basePath}/onboarding/submit`, () =>
    HttpResponse.json({
      party: {
        party_id: MOCK_ONBOARD_PARTY_ID,
        public_key: MOCK_CANTON_PUBLIC_KEY_HEX,
      },
    }),
  ),
];

export default handlers;
