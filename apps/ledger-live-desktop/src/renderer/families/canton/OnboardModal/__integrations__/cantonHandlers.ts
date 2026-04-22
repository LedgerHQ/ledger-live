import { http, HttpResponse } from "msw";

/** Devnet gateway — must match LLC defaults for `canton_network_devnet` and integ test coinConfig. */
export const CANTON_DEVNET_GATEWAY = "https://canton-gateway-devnet.api.live.ledger-test.com";
export const CANTON_DEVNET_NODE_ID = "ledger-live-devnet";

export const MOCK_ONBOARD_PARTY_ID = "mock-party-onboard-integ";

export const MOCK_CANTON_PUBLIC_KEY_HEX = "aa".repeat(32);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const gw = escapeRegExp(CANTON_DEVNET_GATEWAY);
const node = escapeRegExp(CANTON_DEVNET_NODE_ID);

/**
 * Matches GET party lookup by public key (see `getParty` in coin-canton `gateway.ts`).
 * Uses RegExp so MSW always matches the real axios URL (path segment length, query), avoiding
 * path-to-regexp param edge cases that can let requests bypass and hit the real gateway on CI.
 */
export const CANTON_DEVNET_PARTY_BY_PUBKEY_RE = new RegExp(
  `^${gw}/v1/node/${node}/party/[^?#]+\\?[^#]*by=public-key`,
);

/** POST onboarding/prepare for this gateway + node (pathname must match `prepareOnboarding`). */
export const CANTON_DEVNET_ONBOARDING_PREPARE_RE = new RegExp(
  `^${gw}/v1/node/${node}/onboarding/prepare/?$`,
);

/** POST onboarding/submit */
export const CANTON_DEVNET_ONBOARDING_SUBMIT_RE = new RegExp(
  `^${gw}/v1/node/${node}/onboarding/submit/?$`,
);

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

const handlers = [
  http.get(CANTON_DEVNET_PARTY_BY_PUBKEY_RE, () =>
    HttpResponse.json({ message: "not found" }, { status: 404 }),
  ),
  http.post(CANTON_DEVNET_ONBOARDING_PREPARE_RE, () => HttpResponse.json(defaultPrepareResponse)),
  http.post(CANTON_DEVNET_ONBOARDING_SUBMIT_RE, () =>
    HttpResponse.json({
      party: {
        party_id: MOCK_ONBOARD_PARTY_ID,
        public_key: MOCK_CANTON_PUBLIC_KEY_HEX,
      },
    }),
  ),
];

export default handlers;
