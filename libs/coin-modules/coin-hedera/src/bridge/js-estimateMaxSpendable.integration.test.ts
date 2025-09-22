import BigNumber from "bignumber.js";
import { createBridges } from ".";
import { HEDERA_OPERATION_TYPES } from "../constants";
import { estimateFees } from "../logic/estimateFees";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import { getMockedTokenCurrency } from "../test/fixtures/currency.fixture";

describe("js-estimateMaxSpendable", () => {
  let bridge: ReturnType<typeof createBridges>;
  let estimatedFees: Record<"crypto", BigNumber>;

  beforeAll(async () => {
    const signer = jest.fn();
    bridge = createBridges(signer);

    const mockedAccount = getMockedAccount();
    const crypto = await estimateFees(
      mockedAccount.currency,
      HEDERA_OPERATION_TYPES.CryptoTransfer,
    );

    estimatedFees = { crypto };
  });

  test("estimateMaxSpendable returns balance minus fee", async () => {
    const mockedAccount = getMockedAccount();

    const result = await bridge.accountBridge.estimateMaxSpendable({
      account: mockedAccount,
    });

    expect(result).toEqual(mockedAccount.balance.minus(estimatedFees.crypto));
  });

  test("estimateMaxSpendable returns 0 if balance < estimated fees", async () => {
    const mockedAccount = getMockedAccount({ balance: estimatedFees.crypto.minus(1) });

    const result = await bridge.accountBridge.estimateMaxSpendable({
      account: mockedAccount,
    });

    expect(result).toEqual(new BigNumber(0));
  });

  test("estimateMaxSpendable returns token balance for token account", async () => {
    const mockedTokenCurrency = getMockedTokenCurrency();
    const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency);
    const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });

    const result = await bridge.accountBridge.estimateMaxSpendable({
      account: mockedTokenAccount,
      parentAccount: mockedAccount,
    });

    expect(result).toEqual(mockedTokenAccount.balance);
  });
});
