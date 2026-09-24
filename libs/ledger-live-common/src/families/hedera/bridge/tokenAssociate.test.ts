/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { createApi } from "@ledgerhq/coin-hedera/api/index";
import { craftTransaction } from "@ledgerhq/coin-hedera/logic/craftTransaction";
import { rpcClient } from "@ledgerhq/coin-hedera/network/rpc";
import { getCurrencyToUSDRate } from "@ledgerhq/coin-hedera/network/utils";
import {
  getMockedConfig,
  getMockedContext,
} from "@ledgerhq/coin-hedera/test/fixtures/config.fixture";
import { getMockedHTSTokenCurrency } from "@ledgerhq/coin-hedera/test/fixtures/currency.fixture";
import type { HederaMemo, HederaTxData } from "@ledgerhq/coin-hedera/types";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import {
  buildOptimisticOperation,
  getNativeSpendableAfterPending,
  transactionToIntent,
} from "../../../bridge/generic-coin-framework/utils";
import type { GenericTransaction } from "../../../bridge/generic-coin-framework/types";
import hederaBridge from "./api";

jest.mock("@ledgerhq/coin-hedera/network/rpc", () => ({
  rpcClient: require("@ledgerhq/coin-hedera/test/fixtures/rpc.fixture").getMockedRpcClient(),
}));
jest.mock("@ledgerhq/coin-hedera/network/utils", () => ({
  ...jest.requireActual("@ledgerhq/coin-hedera/network/utils"),
  getCurrencyToUSDRate: jest.fn(),
  checkAccountTokenAssociationStatus: jest.fn().mockResolvedValue(false),
}));

const token = getMockedHTSTokenCurrency();
setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => token,
  getTokensSyncHash: async () => "",
});

const currency = getCryptoCurrencyById("hedera");
const { computeIntentType, buildIntentData, describeOptimisticOperation } = hederaBridge(currency);
const account = { id: "js:2:hedera:0.0.54321:", freshAddress: "0.0.54321", currency } as Account;

const association: GenericTransaction = {
  family: "hedera",
  mode: "tokenAssociate",
  amount: new BigNumber(0),
  recipient: "",
  assetReference: token.contractAddress,
  assetOwner: "0.0.54321",
  fees: new BigNumber(10_000_000),
};

const intentOf = (transaction: GenericTransaction) =>
  transactionToIntent(
    account,
    transaction,
    computeIntentType,
    undefined,
    buildIntentData,
  ) as TransactionIntent<HederaMemo, HederaTxData>;

describe("hedera token association, from the generic transaction to the crafted one", () => {
  afterAll(async () => {
    await rpcClient._resetInstance();
  });

  it("builds an association intent", () => {
    expect(intentOf(association)).toMatchObject({
      type: "token-associate",
      sender: "0.0.54321",
      asset: { assetReference: token.contractAddress },
    });
  });

  it("validates an association the account holds no sub-account for yet", async () => {
    jest.mocked(getCurrencyToUSDRate).mockResolvedValue(new BigNumber(1));

    const result = await createApi(currency.id).validateIntent(
      getMockedContext(),
      intentOf(association),
      [{ asset: { type: "native" }, value: 1_000_000_000n, locked: 0n }],
    );

    expect(result).toMatchObject({ errors: {}, amount: 0n, totalSpent: 10_000_000n });
  });

  it("crafts an association of the token, not a coin transfer", async () => {
    const { tx } = await craftTransaction({
      txIntent: intentOf(association),
      configOrCurrencyId: getMockedConfig(),
    });

    invariant("tokenIds" in tx, `${tx.constructor.name} associates no token`);

    expect(tx.tokenIds?.map(String)).toEqual([token.contractAddress]);
    expect(String(tx.accountId)).toBe("0.0.54321");
  });

  it("estimates the fee on the association schedule, not the transfer one", async () => {
    jest.mocked(getCurrencyToUSDRate).mockResolvedValue(new BigNumber(1));
    const api = createApi(currency.id);
    const context = getMockedContext();

    const send: GenericTransaction = {
      family: "hedera",
      mode: "send",
      amount: new BigNumber(1),
      recipient: "0.0.7654321",
    };

    await expect(api.estimateFees(context, intentOf(association))).resolves.toEqual({
      value: 10_000_000n,
    });
    await expect(api.estimateFees(context, intentOf(send))).resolves.toEqual({ value: 20_000n });
  });

  it("records the pending row with the type and token the following sync produces", () => {
    const operation = buildOptimisticOperation(
      account,
      association,
      undefined,
      describeOptimisticOperation,
    );

    expect(operation).toMatchObject({
      type: "ASSOCIATE_TOKEN",
      value: new BigNumber(0),
      fee: new BigNumber(10_000_000),
      extra: { associatedTokenId: token.contractAddress },
    });
  });

  it("locks the association fee once while the association is pending", () => {
    const pendingOperation = buildOptimisticOperation(
      account,
      association,
      undefined,
      describeOptimisticOperation,
    );

    expect(
      getNativeSpendableAfterPending({
        ...account,
        spendableBalance: new BigNumber(1_000_000_000),
        pendingOperations: [pendingOperation],
      }),
    ).toEqual(new BigNumber(990_000_000));
  });
});
