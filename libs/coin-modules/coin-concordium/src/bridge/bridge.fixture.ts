/**
 * Bridge-specific test fixtures for Concordium.
 *
 * For shared fixtures (Account, Transaction, addresses), import from "../test/fixtures".
 * This file contains only bridge-specific fixtures like ConcordiumAccount, Signer, etc.
 */
import BigNumber from "bignumber.js";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { ConcordiumAccount, ConcordiumResources, ConcordiumSigner } from "../types";
import { VALID_ADDRESS, PUBLIC_KEY, CRED_ID, createFixtureCurrency } from "../test/fixtures";

export function createFixtureResources(
  overrides?: Partial<ConcordiumResources>,
): ConcordiumResources {
  return {
    isOnboarded: true,
    credId: CRED_ID,
    publicKey: PUBLIC_KEY,
    identityIndex: 0,
    credNumber: 0,
    ipIdentity: 0,
    ...overrides,
  };
}

/**
 * Creates a ConcordiumAccount with concordiumResources.
 * For basic Account without resources, use createFixtureAccount from "../test/fixtures".
 */
export function createFixtureConcordiumAccount(
  overrides?: Partial<ConcordiumAccount>,
): ConcordiumAccount {
  return {
    type: "Account",
    id: "js:2:concordium:3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w:",
    seedIdentifier: PUBLIC_KEY,
    xpub: PUBLIC_KEY,
    derivationMode: "",
    index: 0,
    currency: createFixtureCurrency(),
    freshAddress: VALID_ADDRESS,
    freshAddressPath: "m/1105'/0'/0'/0'/0'/0'",
    balance: new BigNumber(10000000),
    spendableBalance: new BigNumber(9900000),
    blockHeight: 1000,
    creationDate: new Date("2024-01-01"),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    subAccounts: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    concordiumResources: createFixtureResources(overrides?.concordiumResources),
    ...overrides,
  } as ConcordiumAccount;
}

/**
 * Creates a mock ConcordiumSigner with all methods mocked.
 * Override individual mock implementations as needed in tests.
 */
export function createFixtureSigner(
  overrides?: Partial<Record<keyof ConcordiumSigner, jest.Mock>>,
): ConcordiumSigner {
  return {
    getAddress: jest.fn().mockResolvedValue({
      address: VALID_ADDRESS,
      publicKey: PUBLIC_KEY,
    }),
    getPublicKey: jest.fn().mockResolvedValue(PUBLIC_KEY),
    signTransaction: jest.fn().mockResolvedValue({
      signature: "aa".repeat(64),
      serialized: "cc".repeat(128),
    }),
    signCredentialDeployment: jest.fn().mockResolvedValue("bb".repeat(64)),
    verifyAddress: jest.fn().mockResolvedValue({ verified: true }),
    ...overrides,
  };
}

/**
 * Creates a mock SignerContext that invokes the provided signer.
 */
export function createFixtureSignerContext(
  signer: ConcordiumSigner,
): SignerContext<ConcordiumSigner> {
  return async <U>(_deviceId: string, fn: (s: ConcordiumSigner) => Promise<U>): Promise<U> => {
    return fn(signer);
  };
}

/**
 * IDApp create account response payload for onboarding tests.
 * This matches the structure returned by WalletConnect requestCreateAccount.
 */
export function createFixtureIdAppResponse(overrides?: {
  accountAddress?: string;
  identityIndex?: number;
  credNumber?: number;
}) {
  return {
    status: "success",
    message: {
      serializedCredentialDeploymentTransaction: {
        // Unix timestamp ~2023-11-15
        expiry: 1700000000,
        unsignedCdiStr: JSON.stringify({
          credentialPublicKeys: {
            keys: { "0": { schemeId: "Ed25519", verifyKey: PUBLIC_KEY } },
            threshold: 1,
          },
          credId: CRED_ID,
          ipIdentity: 0,
          revocationThreshold: 2,
          arData: { "1": { encIdCredPubShare: "dd".repeat(96) } },
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
        randomness: {},
      },
      identityIndex: overrides?.identityIndex ?? 0,
      credNumber: overrides?.credNumber ?? 0,
      accountAddress: overrides?.accountAddress ?? VALID_ADDRESS,
    },
  };
}
