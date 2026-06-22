import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";

import { APITransaction } from "./api/api-types";
import {
  buildSubAccounts,
  decodeTokenAssetId,
  decodeTokenCurrencyId,
  getTokenAssetId,
} from "./buildSubAccounts";
import { PaymentCredential } from "./types";

const POLICY_ID = "a".repeat(56);
const ASSET_NAME = "deadbeef";
const ASSET_ID = POLICY_ID + ASSET_NAME;
const PARENT_CURRENCY_ID = "cardano";
const TOKEN_CURRENCY_ID = `${PARENT_CURRENCY_ID}/native/${ASSET_ID}`;
const PAYMENT_KEY = "key";

const parentCurrency = { id: PARENT_CURRENCY_ID } as CryptoCurrency;

const tokenCurrency: TokenCurrency = {
  type: "TokenCurrency",
  id: TOKEN_CURRENCY_ID,
  contractAddress: POLICY_ID,
  parentCurrency,
  tokenType: "native",
  name: "Test Token",
  ticker: "TEST",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "Test Token", code: "TEST", magnitude: 0 }],
};

const accountCredentialsMap: Record<string, PaymentCredential> = {
  [PAYMENT_KEY]: { key: PAYMENT_KEY } as PaymentCredential,
};

function makeTxWithToken({
  hash,
  amount,
  direction,
  assetName = ASSET_NAME,
}: {
  hash: string;
  amount: string;
  direction: "IN" | "OUT";
  assetName?: string;
}): APITransaction {
  const tokenEntry = {
    assetName,
    policyId: POLICY_ID,
    value: amount,
  };
  return {
    hash,
    fees: "0",
    blockHeight: 1,
    timestamp: "2024-01-01T00:00:00.000Z",
    certificate: { stakeRegistrations: [], stakeDeRegistrations: [], stakeDelegations: [] },
    inputs:
      direction === "OUT"
        ? [
            {
              index: 0,
              txId: "txIn",
              address: "addr",
              value: "0",
              tokens: [tokenEntry],
              paymentKey: PAYMENT_KEY,
            },
          ]
        : [],
    outputs:
      direction === "IN"
        ? [
            {
              address: "addr",
              value: "0",
              tokens: [tokenEntry],
              paymentKey: PAYMENT_KEY,
            },
          ]
        : [],
  };
}

describe("buildSubAccounts helpers", () => {
  describe("getTokenAssetId", () => {
    it("concatenates policyId and assetName", () => {
      expect(getTokenAssetId({ policyId: POLICY_ID, assetName: ASSET_NAME })).toBe(ASSET_ID);
    });

    it("returns just policyId when assetName is empty", () => {
      expect(getTokenAssetId({ policyId: POLICY_ID, assetName: "" })).toBe(POLICY_ID);
    });
  });

  describe("decodeTokenAssetId", () => {
    it("splits the asset id into 56-char policyId and remaining assetName", () => {
      expect(decodeTokenAssetId(ASSET_ID)).toEqual({
        policyId: POLICY_ID,
        assetName: ASSET_NAME,
      });
    });

    it("returns empty assetName when only the policyId is present", () => {
      expect(decodeTokenAssetId(POLICY_ID)).toEqual({
        policyId: POLICY_ID,
        assetName: "",
      });
    });
  });

  describe("decodeTokenCurrencyId", () => {
    it("splits the token currency id into its three segments", () => {
      expect(decodeTokenCurrencyId(TOKEN_CURRENCY_ID)).toEqual({
        parentCurrencyId: PARENT_CURRENCY_ID,
        type: "native",
        assetId: ASSET_ID,
      });
    });
  });
});

describe("buildSubAccounts", () => {
  let findTokenByAddressInCurrency: jest.Mock;

  beforeEach(() => {
    findTokenByAddressInCurrency = jest
      .fn()
      .mockImplementation(async (address: string, currencyId: string, identifier?: string) => {
        if (
          address === POLICY_ID &&
          currencyId === PARENT_CURRENCY_ID &&
          identifier === ASSET_NAME
        ) {
          return tokenCurrency;
        }
        return undefined;
      });

    setupMockCryptoAssetsStore({
      findTokenByAddressInCurrency,
      findTokenById: async (id: string) => (id === TOKEN_CURRENCY_ID ? tokenCurrency : undefined),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("looks up tokens by (policyId, parentCurrencyId, assetName) via findTokenByAddressInCurrency", async () => {
    const tx = makeTxWithToken({ hash: "tx1", amount: "100", direction: "IN" });

    await buildSubAccounts({
      initialAccount: undefined,
      parentAccountId: "parent-account-id",
      parentCurrency,
      newTransactions: [tx],
      tokens: [{ policyId: POLICY_ID, assetName: ASSET_NAME, amount: new BigNumber(100) }],
      accountCredentialsMap,
    });

    expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
      POLICY_ID,
      PARENT_CURRENCY_ID,
      ASSET_NAME,
    );
  });

  it("passes undefined (not an empty string) as token identifier when assetName is empty", async () => {
    const tx = makeTxWithToken({ hash: "tx1", amount: "100", direction: "IN", assetName: "" });

    await buildSubAccounts({
      initialAccount: undefined,
      parentAccountId: "parent-account-id",
      parentCurrency,
      newTransactions: [tx],
      tokens: [{ policyId: POLICY_ID, assetName: "", amount: new BigNumber(100) }],
      accountCredentialsMap,
    });

    expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(
      POLICY_ID,
      PARENT_CURRENCY_ID,
      undefined,
    );
  });

  it("skips tokens that are not supported by ledger-live", async () => {
    findTokenByAddressInCurrency.mockResolvedValue(undefined);

    const tx = makeTxWithToken({ hash: "tx1", amount: "100", direction: "IN" });
    const subAccounts = await buildSubAccounts({
      initialAccount: undefined,
      parentAccountId: "parent-account-id",
      parentCurrency,
      newTransactions: [tx],
      tokens: [{ policyId: POLICY_ID, assetName: ASSET_NAME, amount: new BigNumber(100) }],
      accountCredentialsMap,
    });

    expect(subAccounts).toEqual([]);
  });

  it("matches the on-chain balance by decoding assetId from tokenCurrency.id", async () => {
    const tx = makeTxWithToken({ hash: "tx1", amount: "42", direction: "IN" });

    const subAccounts = await buildSubAccounts({
      initialAccount: undefined,
      parentAccountId: "parent-account-id",
      parentCurrency,
      newTransactions: [tx],
      tokens: [{ policyId: POLICY_ID, assetName: ASSET_NAME, amount: new BigNumber(42) }],
      accountCredentialsMap,
    });

    expect(subAccounts).toHaveLength(1);
    expect(subAccounts[0].balance).toEqual(new BigNumber(42));
    expect(subAccounts[0].spendableBalance).toEqual(new BigNumber(42));
  });

  it("falls back to zero balance when no matching token balance is provided", async () => {
    const tx = makeTxWithToken({ hash: "tx1", amount: "10", direction: "IN" });

    const subAccounts = await buildSubAccounts({
      initialAccount: undefined,
      parentAccountId: "parent-account-id",
      parentCurrency,
      newTransactions: [tx],
      tokens: [],
      accountCredentialsMap,
    });

    expect(subAccounts).toHaveLength(1);
    expect(subAccounts[0].balance).toEqual(new BigNumber(0));
  });
});
