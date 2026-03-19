import { AppManifest, WalletAPITransaction } from "../../types";
import {
  createFixtureAccount,
  createFixtureCryptoCurrency,
  createFixtureTokenAccount,
} from "../../../mock/fixtures/cryptoCurrencies";
import { OperationType, SignedOperation, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { TrackingAPI } from "../../tracking";
import { WalletAPIContext } from "../context";

export { createFixtureAccount, createFixtureCryptoCurrency, createFixtureTokenAccount };

export function createWalletAPIEtherumTransaction(): WalletAPITransaction {
  return {
    family: "ethereum",
    amount: BigNumber(1000000000),
    recipient: "0x0123456",
    nonce: 8,
    data: Buffer.from("Some data..."),
    gasPrice: BigNumber(700000),
    gasLimit: BigNumber(1200000),
  };
}

export function createWalletAPIBitcoinTransaction(): WalletAPITransaction {
  return {
    family: "bitcoin",
    amount: BigNumber(1000000000),
    recipient: "0x0123456",
    feePerByte: BigNumber(900000),
  };
}

export function createAppManifest(id = "1"): AppManifest {
  return {
    id,
    private: false,
    name: "New App Manifest",
    url: "https://www.ledger.com",
    homepageUrl: "https://www.ledger.com",
    supportUrl: "https://www.ledger.com",
    icon: null,
    platforms: ["ios", "android", "desktop"],
    apiVersion: "1.0.0",
    manifestVersion: "1.0.0",
    branch: "debug",
    params: undefined,
    categories: [],
    currencies: "*",
    content: {
      shortDescription: {
        en: "short description",
      },
      description: {
        en: "description",
      },
    },
    permissions: [],
    domains: [],
    visibility: "complete",
  };
}

export function createContextContainingAccountId({
  tracking,
  accountsParams,
}: {
  tracking: Partial<TrackingAPI>;
  accountsParams: Array<{ id: string; currency?: CryptoCurrency }>;
}): WalletAPIContext {
  return {
    manifest: createAppManifest(),
    accounts: accountsParams
      .map(({ id, currency }) => createFixtureAccount(id, currency))
      .concat([createFixtureAccount()]),
    tracking: tracking as TrackingAPI,
  };
}

export function createSignedOperation(): SignedOperation {
  const operation = {
    id: "42",
    hash: "hashed",
    type: "IN" as OperationType,
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId: "14",
    date: new Date(),
    extra: {},
  };
  return {
    operation,
    signature: "Signature",
  };
}

export function createWalletAPIAccount() {
  return {
    id: "12",
    name: "",
    address: "",
    currency: "",
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    blockHeight: 0,
    lastSyncDate: new Date(),
  };
}

export function createMessageData() {
  return {
    account: createFixtureAccount("17"),
    message: "default message",
  };
}

export function createTokenAccount(id = "32"): TokenAccount {
  return {
    type: "TokenAccount",
    id,
    parentId: "whatever",
    token: createTokenCurrency(),
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      WEEK: { latestDate: null, balances: [] },
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
    },
    swapHistory: [],
  };
}

export function createTokenCurrency(): TokenCurrency {
  return {
    type: "TokenCurrency",
    id: "3",
    contractAddress: "",
    parentCurrency: createFixtureCryptoCurrency("eth"),
    tokenType: "",
    name: "",
    ticker: "",
    units: [],
  };
}
