/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/coin-hedera/constants";
import { getMockedHTSTokenCurrency } from "@ledgerhq/coin-hedera/test/fixtures/currency.fixture";
import type { HederaAccount, Transaction } from "@ledgerhq/coin-hedera/types/index";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { of } from "rxjs";
import type { HederaGenericTransaction } from "./types";
import { toLegacyTransaction, withGenericTransactionSupport } from "./legacyBridgeAdapter";

const token = getMockedHTSTokenCurrency();
const findTokenByAddressInCurrency = jest.fn(async () => token);
setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency,
  getTokensSyncHash: async () => "",
});

const account = { currency: getCryptoCurrencyById("hedera") } as HederaAccount;
const common = { family: "hedera" as const, amount: new BigNumber(0), recipient: "" };

function generic(patch: Partial<HederaGenericTransaction>): Transaction {
  return { ...common, mode: "send", ...patch } as unknown as Transaction;
}

describe("toLegacyTransaction", () => {
  it.each([
    ["delegate", "3", HEDERA_TRANSACTION_MODES.Delegate, 3],
    ["redelegate", "0", HEDERA_TRANSACTION_MODES.Redelegate, 0],
    ["delegate", undefined, HEDERA_TRANSACTION_MODES.Delegate, null],
  ] as const)(
    "maps %s with valId %s to stakingNodeId",
    (mode, valId, legacyMode, stakingNodeId) => {
      const legacy = toLegacyTransaction(generic({ mode, valId }));

      expect(legacy).toMatchObject({ mode: legacyMode, valId, properties: { stakingNodeId } });
    },
  );

  it("clears the node on undelegate", () => {
    expect(toLegacyTransaction(generic({ mode: "undelegate" }))).toMatchObject({
      mode: HEDERA_TRANSACTION_MODES.Undelegate,
      properties: { stakingNodeId: null },
    });
  });

  it("maps the two modes whose spelling differs", () => {
    expect(toLegacyTransaction(generic({ mode: "claimReward" })).mode).toBe(
      HEDERA_TRANSACTION_MODES.ClaimRewards,
    );
    expect(toLegacyTransaction(generic({ mode: "tokenAssociate" }), token)).toMatchObject({
      mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
      properties: { token },
    });
  });

  it("copies the generic memo into the legacy one", () => {
    expect(toLegacyTransaction(generic({ memoType: "string", memoValue: "ref-42" })).memo).toBe(
      "ref-42",
    );
  });

  it("leaves a legacy transaction unchanged", () => {
    const legacy: Transaction = {
      ...common,
      mode: HEDERA_TRANSACTION_MODES.Delegate,
      memo: "legacy memo",
      properties: { stakingNodeId: 7 },
    };

    expect(toLegacyTransaction(legacy)).toEqual(legacy);
  });

  it("is idempotent", () => {
    const once = toLegacyTransaction(generic({ mode: "claimReward", memoValue: "m" }));

    expect(toLegacyTransaction(once)).toEqual(once);
  });
});

describe("withGenericTransactionSupport", () => {
  const legacyBridge = {
    prepareTransaction: jest.fn(async (_account: unknown, tx: Transaction) => tx),
    getTransactionStatus: jest.fn(async () => ({})),
    estimateMaxSpendable: jest.fn(async () => new BigNumber(0)),
    signOperation: jest.fn(() => of()),
  } as unknown as AccountBridge<Transaction, HederaAccount>;
  const bridge = withGenericTransactionSupport(legacyBridge as never);

  beforeEach(() => jest.clearAllMocks());

  it("resolves the association token from its address before the legacy prepare", async () => {
    await bridge.prepareTransaction(
      account,
      generic({ mode: "tokenAssociate", assetReference: "0.0.1234" }),
    );

    expect(findTokenByAddressInCurrency).toHaveBeenCalledWith("0.0.1234", "hedera");
    expect(legacyBridge.prepareTransaction).toHaveBeenCalledWith(
      account,
      expect.objectContaining({ properties: { token } }),
    );
  });

  it("converts the transaction for status, max spendable and signing", () => {
    const tx = generic({ mode: "delegate", valId: "5" });
    const converted = expect.objectContaining({ properties: { stakingNodeId: 5 } });

    bridge.getTransactionStatus(account, tx);
    bridge.estimateMaxSpendable({ account, transaction: tx });
    bridge.signOperation({ account, transaction: tx, deviceId: "" });

    expect(legacyBridge.getTransactionStatus).toHaveBeenCalledWith(account, converted);
    expect(legacyBridge.estimateMaxSpendable).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: converted }),
    );
    expect(legacyBridge.signOperation).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: converted }),
    );
  });
});
