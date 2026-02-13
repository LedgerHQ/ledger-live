jest.mock("@ledgerhq/coin-framework/account/index");
jest.mock("./createTransaction");
jest.mock("./getEstimatedFees");

import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import BigNumber from "bignumber.js";
import estimateMaxSpendable from "./estimateMaxSpendable";
import { createTransaction } from "./createTransaction";
import getEstimatedFees from "./getEstimatedFees";

const mockGetMainAccount = getMainAccount as jest.MockedFunction<typeof getMainAccount>;
const mockCreateTransaction = createTransaction as jest.MockedFunction<typeof createTransaction>;
const mockGetEstimatedFees = getEstimatedFees as jest.MockedFunction<typeof getEstimatedFees>;

describe("estimateMaxSpendable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAccount = {
    id: "mock_account",
    freshAddress: "B62qtest",
    spendableBalance: new BigNumber(10000),
    currency: { family: "mina" },
    pendingOperations: [],
  };

  beforeEach(() => {
    mockGetMainAccount.mockReturnValue(mockAccount as any);
    mockCreateTransaction.mockReturnValue({
      family: "mina",
      amount: new BigNumber(0),
      recipient: "",
      fees: { fee: new BigNumber(0), accountCreationFee: new BigNumber(0) },
      memo: undefined,
      nonce: 0,
    });
  });

  it("should return max spendable amount", async () => {
    mockGetEstimatedFees.mockResolvedValue({
      fee: new BigNumber(100),
      accountCreationFee: new BigNumber(0),
    });

    const result = await estimateMaxSpendable({
      account: mockAccount as any,
      parentAccount: undefined,
      transaction: undefined,
    });

    expect(result).toEqual(new BigNumber(9900));
  });

  it("should return 0 when fees exceed balance", async () => {
    mockGetEstimatedFees.mockResolvedValue({
      fee: new BigNumber(20000),
      accountCreationFee: new BigNumber(0),
    });

    const result = await estimateMaxSpendable({
      account: mockAccount as any,
      parentAccount: undefined,
      transaction: undefined,
    });

    expect(result).toEqual(new BigNumber(0));
  });

  it("should merge provided transaction with created transaction", async () => {
    mockGetEstimatedFees.mockResolvedValue({
      fee: new BigNumber(100),
      accountCreationFee: new BigNumber(0),
    });

    const customTxn = { recipient: "B62qrecipient", memo: "test" };
    await estimateMaxSpendable({
      account: mockAccount as any,
      parentAccount: undefined,
      transaction: customTxn as any,
    });

    expect(mockGetEstimatedFees).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: "B62qrecipient",
        memo: "test",
        amount: new BigNumber(10000),
      }),
      "B62qtest",
    );
  });
});
