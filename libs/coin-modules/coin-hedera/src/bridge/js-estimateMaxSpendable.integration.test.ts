import BigNumber from "bignumber.js";
import { createBridges } from ".";
import { HEDERA_OPERATION_TYPES } from "../constants";
import { estimateFees } from "../logic/estimateFees";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import { getMockedHTSTokenCurrency } from "../test/fixtures/currency.fixture";
import type { EstimateFeesResult } from "../types";

describe("js-estimateMaxSpendable", () => {
  let bridge: ReturnType<typeof createBridges>;
  let estimatedFees: Record<"crypto", EstimateFeesResult>;

  beforeAll(async () => {
    const signer = jest.fn();
    bridge = createBridges(signer);

    const mockedAccount = getMockedAccount();
    const crypto = await estimateFees({
      currency: mockedAccount.currency,
      operationType: HEDERA_OPERATION_TYPES.CryptoTransfer,
    });

    estimatedFees = { crypto };
  });

  test("estimateMaxSpendable returns balance minus fee", async () => {
    const mockedAccount = getMockedAccount();

    const result = await bridge.accountBridge.estimateMaxSpendable({
      account: mockedAccount,
    });

    const expected = mockedAccount.balance.minus(estimatedFees.crypto.tinybars);

    expect(result).toEqual(expected);
  });

  test("estimateMaxSpendable returns 0 if balance < estimated fees", async () => {
    const mockedAccount = getMockedAccount({ balance: estimatedFees.crypto.tinybars.minus(1) });

    const result = await bridge.accountBridge.estimateMaxSpendable({
      account: mockedAccount,
    });

    expect(result).toEqual(new BigNumber(0));
  });

  test("estimateMaxSpendable returns token balance for token account", async () => {
    const mockedTokenCurrency = getMockedHTSTokenCurrency();
    const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency);
    const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });

    const result = await bridge.accountBridge.estimateMaxSpendable({
      account: mockedTokenAccount,
      parentAccount: mockedAccount,
    });

    expect(result).toEqual(mockedTokenAccount.balance);
  });
});
