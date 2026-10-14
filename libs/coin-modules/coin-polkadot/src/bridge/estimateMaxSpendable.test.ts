import type { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { createMockPolkadotContext } from "../test/config.fixture";
import { PolkadotAccount, Transaction } from "../types";
import { buildEstimateMaxSpendable } from "./estimateMaxSpendable";

// Module-level mocks
const mockGetMainAccount = jest.fn();
jest.mock("@ledgerhq/ledger-wallet-framework/account", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/account"),
  getMainAccount: (...args: unknown[]) => mockGetMainAccount(...args),
}));

const mockGetEstimatedFees = jest.fn();
jest.mock("./getFeesForTransaction", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockGetEstimatedFees(...args),
}));

const mockCalculateAmount = jest.fn();
jest.mock("./utils", () => ({
  ...jest.requireActual("./utils"),
  calculateAmount: (...args: unknown[]) => mockCalculateAmount(...args),
}));

describe("estimateMaxSpendable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the maximum spendable for a transaction", async () => {
    mockGetMainAccount.mockReturnValue({ currency: { id: "polkadot" } } as PolkadotAccount);
    mockGetEstimatedFees.mockResolvedValueOnce(new BigNumber(1));

    const computedAmount = new BigNumber(2);
    mockCalculateAmount.mockReturnValueOnce(computedAmount);

    const transaction = {} as Transaction;
    const maximumSpendable = await buildEstimateMaxSpendable(createMockPolkadotContext())({
      account: {} as AccountLike,
      parentAccount: null,
      transaction,
    });

    expect(maximumSpendable).toEqual(computedAmount);
  });
});
