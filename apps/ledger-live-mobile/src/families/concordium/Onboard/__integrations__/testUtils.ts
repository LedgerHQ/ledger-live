/* eslint-disable @typescript-eslint/no-explicit-any */
import { http, HttpResponse } from "msw";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { State } from "~/reducers/types";

// ── Constants ──

export const SESSION_TOPIC = "ABCDsession-topic-rest";
export const PROXY_URL = "https://ccd-wallet-proxy-mainnet.coin.ledger.com";
export const TEST_PUBLIC_KEY = "aa".repeat(32);
export const TEST_SIGNATURE = "bb".repeat(64);
export const WC_RAW_URI = "wc:test-pairing-uri";
export const WC_FORMATTED_URI = `concordiumidapp://wallet-connect?encodedUri=${WC_RAW_URI}`;

export const COIN_CONFIG = () => ({
  status: { type: "active" } as const,
  networkType: "mainnet" as const,
  grpcUrl: "https://ccd-node-mainnet.coin.ledger.com",
  grpcPort: 443,
  proxyUrl: PROXY_URL,
  minReserve: 0,
});

export const TEST_SERIALIZED_CDT = {
  expiry: Math.floor(Date.now() / 1000) + 60 * 60,
  unsignedCdiStr: JSON.stringify({
    credentialPublicKeys: {
      keys: { "0": { schemeId: "Ed25519", verifyKey: TEST_PUBLIC_KEY } },
      threshold: 1,
    },
    credId: "dd".repeat(48),
    ipIdentity: 0,
    revocationThreshold: 2,
    arData: { "1": { encIdCredPubShare: "cc".repeat(96) } },
    policy: { validTo: "202612", createdAt: "202512", revealedAttributes: {} },
    proofs: {
      sig: "ee".repeat(64),
      commitments: "ff".repeat(100),
      challenge: "00".repeat(32),
      proofIdCredPub: { "0": "11".repeat(50) },
      proofIpSig: "22".repeat(64),
      proofRegId: "33".repeat(48),
      credCounterLessThanMaxAccounts: "44".repeat(100),
    },
  }),
  randomness: {
    idCredSecRand: "aa",
    prfRand: "bb",
    credCounterRand: "cc",
    maxAccountsRand: "dd",
    attributesRand: {},
  },
};

// ── Test data ──

export const currency = getCryptoCurrencyById("concordium");
export const creatableAccount = { ...genAccount("concordium-1", { currency }), used: false };

// ── WalletConnect session ──

export function createSession() {
  return {
    topic: SESSION_TOPIC,
    namespaces: { ccd: { chains: ["ccd:9dd9ca4d19e9393877d2c44b70f89acb"] } },
    expiry: Math.floor(Date.now() / 1000) + 86400,
  };
}

// ── Redux state ──

export const overrideInitialState = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    lastConnectedDevice: {
      deviceId: "test-device-id",
      modelId: DeviceModelId.nanoX,
      wired: false,
    },
  },
});

// ── MSW handlers ──

export const concordiumHandlers = [
  http.put(`${PROXY_URL}/v0/submitCredential/`, () => {
    return HttpResponse.json({ submissionId: "test-submission-id" });
  }),
];
