import BigNumber from "bignumber.js";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { TRANSACTION_TYPE } from "@ledgerhq/coin-aleo/constants";
import type {
  AleoAccount,
  AleoCoinConfig,
  AleoResources,
  RecordPickingStrategy,
} from "@ledgerhq/coin-aleo/types";
import { ALEO_FAKE_NODE, ALEO_LOCAL_SDK, ALEO_NETWORK_TYPE } from "./constants";
import { loadAleoWasm } from "./wasm";

// The only prefunded account: devnode seeds genesis from the Dockerfile's single `--private-key`.
export const GENESIS_ACCOUNT = {
  privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH",
  viewKey: "AViewKey1mSnpFFC8Mj4fXbK5YiWgZ3mjiV8CxA79bYNa8ymUpTrw",
  address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
} as const;

export const TRANSFER_AMOUNT_MICROCREDITS = 1_000_000;

export const FUNDING_AMOUNT_MICROCREDITS = TRANSFER_AMOUNT_MICROCREDITS * 2;

export const RECORD_A_MICROCREDITS = TRANSFER_AMOUNT_MICROCREDITS * 2;

export const RECORD_B_MICROCREDITS = TRANSFER_AMOUNT_MICROCREDITS / 5;

export type GeneratedAleoAccount = { privateKey: string; viewKey: string; address: string };

export async function generateAleoAccount(): Promise<GeneratedAleoAccount> {
  const wasm = await loadAleoWasm();
  const privateKey = new wasm.PrivateKey();
  return {
    privateKey: privateKey.to_string(),
    viewKey: privateKey.to_view_key().to_string(),
    address: privateKey.to_address().to_string(),
  };
}

export const ALEO = getCryptoCurrencyById("aleo_testnet");

// Production config (ledger-live-common families/aleo/config.ts) except useEncryptedProve: false.
export function buildAleoCoinConfig(
  options: { recordPickingStrategy?: RecordPickingStrategy } = {},
): AleoCoinConfig {
  return {
    status: { type: "active" },
    name: "Aleo (Testnet)",
    unit: { name: "Aleo", code: "ALEO", magnitude: 6 },
    networkType: ALEO_NETWORK_TYPE,
    apiUrls: {
      node: ALEO_FAKE_NODE,
      sdk: ALEO_LOCAL_SDK,
    },
    feeByTransactionType: {
      [TRANSACTION_TYPE.TRANSFER_PUBLIC]: 34060,
      [TRANSACTION_TYPE.TRANSFER_PRIVATE]: 2308,
      [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: 17972,
      [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: 18494,
      [TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC]: 34060,
      [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE]: 2308,
      [TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC]: 18494,
      [TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE]: 17972,
      [TRANSACTION_TYPE.BOND_PUBLIC]: 5621,
      [TRANSACTION_TYPE.UNBOND_PUBLIC]: 10813,
      [TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC]: 3066,
    },
    feeSafetyMultiplier: 1,
    isFeeSponsored: true,
    enableTokens: false,
    enableStaking: false,
    useEncryptedProve: false,
    recordPickingStrategy: options.recordPickingStrategy ?? "auto",
    liveBlockHeightPollMs: 10_000,
    maxUnbondingSyncAttempts: 3,
  };
}

export function makeAleoAccount(address: string, viewKey: string): AleoAccount {
  const derivationMode = "";
  const id = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: ALEO.id,
    xpubOrAddress: address,
    derivationMode,
    customData: viewKey, // sync reads the view key back via decodeAccountId
  });
  const index = 0;
  const freshAddressPath = runDerivationScheme(
    getDerivationScheme({ derivationMode, currency: ALEO }),
    ALEO,
    { account: index, node: 0, address: 0 },
  );

  return {
    type: "Account",
    id,
    xpub: address,
    subAccounts: [],
    seedIdentifier: address,
    used: true,
    swapHistory: [],
    derivationMode,
    currency: ALEO,
    index,
    nfts: [],
    freshAddress: address,
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
  };
}

export function makePrivateAleoAccount(address: string, viewKey: string): AleoAccount {
  const aleoResources: AleoResources = {
    transparentBalance: new BigNumber(0),
    provableApi: null,
    privateBalance: null,
    unspentPrivateRecords: null,
    // Non-null, or buildSyncObservables never runs the private sync step.
    lastPrivateSyncDate: new Date(0),
  };

  return { ...makeAleoAccount(address, viewKey), aleoResources };
}
