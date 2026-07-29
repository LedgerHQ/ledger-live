import BigNumber from "bignumber.js";
import { HEDERA_OPERATION_TYPES } from "../constants";
import { estimateFees } from "../logic/estimateFees";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import { getMockedHTSTokenCurrency } from "../test/fixtures/currency.fixture";
import { estimateMaxSpendable } from "./estimateMaxSpendable";

jest.mock("../logic/estimateFees");

describe("estimateMaxSpendable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the token balance directly for token accounts, without calling estimateFees", async () => {
    const tokenCurrency = getMockedHTSTokenCurrency();
    const mainAccount = getMockedAccount();
    const tokenAccount = getMockedTokenAccount(tokenCurrency);

    const result = await estimateMaxSpendable({
      account: tokenAccount,
      parentAccount: mainAccount,
    });

    expect(result).toEqual(tokenAccount.balance);
    expect(estimateFees).not.toHaveBeenCalled();
  });

  it("returns balance minus estimated fees for a main HBAR account", async () => {
    const account = getMockedAccount({ balance: new BigNumber(1_000) });
    jest
      .mocked(estimateFees)
      .mockResolvedValue({ tinybars: new BigNumber(100), gas: new BigNumber(0) });

    const result = await estimateMaxSpendable({ account });

    expect(result).toEqual(new BigNumber(900));
    expect(estimateFees).toHaveBeenCalledTimes(1);
    expect(estimateFees).toHaveBeenCalledWith({
      currencyId: account.currency.id,
      operationType: HEDERA_OPERATION_TYPES.CryptoTransfer,
    });
  });

  it("returns zero when account balance is less than the estimated fee", async () => {
    const account = getMockedAccount({ balance: new BigNumber(50) });
    jest
      .mocked(estimateFees)
      .mockResolvedValue({ tinybars: new BigNumber(100), gas: new BigNumber(0) });

    const result = await estimateMaxSpendable({ account });

    expect(result).toEqual(new BigNumber(0));
  });

  it("returns zero when balance exactly equals the estimated fee", async () => {
    const account = getMockedAccount({ balance: new BigNumber(100) });
    jest
      .mocked(estimateFees)
      .mockResolvedValue({ tinybars: new BigNumber(100), gas: new BigNumber(0) });

    const result = await estimateMaxSpendable({ account });

    expect(result).toEqual(new BigNumber(0));
  });
});
