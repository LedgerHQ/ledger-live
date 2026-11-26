import BigNumber from "bignumber.js";
import { getCalTokensCached } from "../network/gateway";
import {
  createMockCantonAccount,
  createMockCoinConfigValue,
  createMockContext,
  createMockTokenAccount,
  createMockTransaction,
} from "../test/fixtures";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("../network/gateway", () => ({
  ...jest.requireActual("../network/gateway"),
  getCalTokensCached: jest.fn(),
}));

const CC = new BigNumber(10).pow(38);
const tokenAccount = createMockTokenAccount({
  balance: new BigNumber(500),
  spendableBalance: new BigNumber(500),
});
const account = createMockCantonAccount({
  balance: CC.times(9),
  spendableBalance: CC.times(9),
  subAccounts: [tokenAccount],
});
const sendMax = createMockTransaction({ amount: new BigNumber(0), useAllAmount: true });

describe.each([0, 1])("estimateMaxSpendable with a fee of %i CC", fee => {
  const context = createMockContext({ ...createMockCoinConfigValue(), fee, minReserve: 0 });

  beforeEach(() => {
    jest.mocked(getCalTokensCached).mockResolvedValue(new Map([["canton_network/usdcx", "USDCx"]]));
  });

  it.each([true, false])(
    "should match the CC amount Send max prepares, Send max on: %s",
    async useAllAmount => {
      const prepared = await prepareTransaction(context, account, sendMax);

      const max = await estimateMaxSpendable(context, {
        account,
        transaction: createMockTransaction({ useAllAmount }),
      });

      expect(max).toEqual(CC.times(9 - fee));
      expect(max).toEqual(prepared.amount);
    },
  );

  it.each([true, false])(
    "should match the token amount Send max prepares, Send max on: %s",
    async useAllAmount => {
      const prepared = await prepareTransaction(context, account, {
        ...sendMax,
        subAccountId: tokenAccount.id,
      });

      const max = await estimateMaxSpendable(context, {
        account: tokenAccount,
        parentAccount: account,
        transaction: createMockTransaction({ useAllAmount, subAccountId: tokenAccount.id }),
      });

      expect(max).toEqual(new BigNumber(500));
      expect(max).toEqual(prepared.amount);
    },
  );

  it("should give the CC amount for the main account, even with a token chosen", async () => {
    const max = await estimateMaxSpendable(context, {
      account,
      transaction: createMockTransaction({ subAccountId: tokenAccount.id }),
    });

    expect(max).toEqual(CC.times(9 - fee));
  });
});

describe("estimateMaxSpendable with a fee that grows with the amount", () => {
  const context = createMockContext({ ...createMockCoinConfigValue(), minReserve: 0 });

  it("should match the CC amount Send max prepares", async () => {
    const baseFeeAndOnePercentOfTheBalance = CC.plus(CC.times(9).div(100));
    const prepared = await prepareTransaction(context, account, sendMax);

    const max = await estimateMaxSpendable(context, {
      account,
      transaction: createMockTransaction(),
    });

    expect(max).toEqual(CC.times(9).minus(baseFeeAndOnePercentOfTheBalance));
    expect(max).toEqual(prepared.amount);
  });
});
