/**
 * Test fixtures for Concordium bridge tests.
 *
 * Usage:
 *   import { createFixtureAccount, createFixtureTransaction, ... } from "./bridge.fixture";
 *   const account = createFixtureAccount({ balance: new BigNumber(5000) });
 */
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { ConcordiumAccount, ConcordiumResources, Transaction } from "../types";
import type { ConcordiumSigner } from "../types/signer";

// Valid Concordium address derived from abandon seed phrase
export const VALID_ADDRESS = "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w";

// 64 hex characters (32 bytes) - standard Ed25519 public key length
export const PUBLIC_KEY = "aa".repeat(32);

// 96 hex characters (48 bytes) - standard credential ID length
export const CRED_ID = "cc".repeat(48);

export function createFixtureCurrency(overrides?: Partial<CryptoCurrency>): CryptoCurrency {
  return {
    type: "CryptoCurrency",
    id: "concordium",
    name: "Concordium",
    family: "concordium",
    ticker: "CCD",
    scheme: "concordium",
    color: "#000000",
    units: [{ name: "CCD", code: "CCD", magnitude: 6 }],
    managerAppName: "Concordium",
    ...overrides,
  } as CryptoCurrency;
}

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

export function createFixtureAccount(overrides?: Partial<ConcordiumAccount>): ConcordiumAccount {
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
 * Creates a basic Account (without concordiumResources).
 * Use createFixtureAccount for ConcordiumAccount with resources.
 */
export function createFixtureBaseAccount(overrides?: Partial<Account>): Account {
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
    ...overrides,
  } as Account;
}

export function createFixtureTransaction(overrides?: Partial<Transaction>): Transaction {
  return {
    family: "concordium",
    amount: new BigNumber(1000000),
    recipient: VALID_ADDRESS,
    fee: new BigNumber(1000),
    useAllAmount: false,
    memo: undefined,
    ...overrides,
  } as Transaction;
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
    // 128 hex characters (64 bytes) - Ed25519 signature length
    signTransfer: jest.fn().mockResolvedValue("aa".repeat(64)),
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
