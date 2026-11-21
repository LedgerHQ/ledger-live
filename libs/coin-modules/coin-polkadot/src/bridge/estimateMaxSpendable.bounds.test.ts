import BigNumber from "bignumber.js";
import { createMockPolkadotContext } from "../test/config.fixture";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import { buildEstimateMaxSpendable } from "./estimateMaxSpendable";
import { buildGetTransactionStatus } from "./getTransactionStatus";

const mockGetEstimatedFees = jest.fn();
jest.mock("./getFeesForTransaction", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockGetEstimatedFees(...args),
}));

const stubIsNewAccount = jest.fn();
jest.mock("../network", () => ({
  isNewAccount: () => stubIsNewAccount(),
}));

const RECIPIENT = "15oodc5d8DWJodZhTD6qsxxSQRYWhdkWCrwqNHajDirXRrAD";
const FEES = new BigNumber(158_612_606);

describe("estimateMaxSpendable bounds", () => {
  const context = createMockPolkadotContext();
  const estimateMaxSpendable = buildEstimateMaxSpendable(context);
  const getTransactionStatus = buildGetTransactionStatus(context);

  const accountWith = (spendableBalance: BigNumber) =>
    createFixtureAccount({ balance: spendableBalance, spendableBalance });

  beforeEach(() => {
    mockGetEstimatedFees.mockReset();
    mockGetEstimatedFees.mockResolvedValue(FEES);
    stubIsNewAccount.mockReset();
    stubIsNewAccount.mockResolvedValue(false);
  });

  it("estimates an amount between zero and the spendable balance", async () => {
    const account = accountWith(new BigNumber(100_000_000_000));

    const estimation = await estimateMaxSpendable({ account, parentAccount: null });

    expect([estimation.gte(0), estimation.lte(account.spendableBalance)]).toEqual([true, true]);
  });

  it("estimates the spendable balance minus the fees", async () => {
    const account = accountWith(new BigNumber(100_000_000_000));

    const estimation = await estimateMaxSpendable({ account, parentAccount: null });

    expect(estimation.toString()).toBe("99841387394");
  });

  it("estimates zero when the fees exceed the spendable balance", async () => {
    const account = accountWith(new BigNumber(1_000));

    const estimation = await estimateMaxSpendable({ account, parentAccount: null });

    expect(estimation.toString()).toBe("0");
  });

  it("estimates the amount of the status when using all the amount", async () => {
    const account = accountWith(new BigNumber(100_000_000_000));
    const transaction = {
      ...createFixtureTransaction({ recipient: RECIPIENT, fees: FEES }),
      useAllAmount: true,
    };

    const [estimation, status] = await Promise.all([
      estimateMaxSpendable({ account, parentAccount: null, transaction }),
      getTransactionStatus(account, transaction),
    ]);

    expect(estimation.toString()).toBe(status.amount.toString());
  });
});
