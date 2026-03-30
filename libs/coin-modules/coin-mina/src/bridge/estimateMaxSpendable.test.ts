jest.mock("@ledgerhq/ledger-wallet-framework/account/index");
jest.mock("./createTransaction");
jest.mock("./getEstimatedFees");

import { DeepPartial } from "@ledgerhq/coin-framework/test/utils";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import BigNumber from "bignumber.js";
import { MinaAccount, Transaction } from "../types";
import { createTransaction } from "./createTransaction";
import estimateMaxSpendable from "./estimateMaxSpendable";
import getEstimatedFees from "./getEstimatedFees";

const mockGetMainAccount = getMainAccount as jest.MockedFunction<typeof getMainAccount>;
const mockCreateTransaction = createTransaction as jest.MockedFunction<typeof createTransaction>;
const mockGetEstimatedFees = getEstimatedFees as jest.MockedFunction<typeof getEstimatedFees>;

describe("estimateMaxSpendable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAccount: DeepPartial<MinaAccount> = {
    id: "mock_account",
    freshAddress: "B62qtest",
    spendableBalance: new BigNumber(10000),
    currency: { family: "mina" },
    pendingOperations: [],
  };

  beforeEach(() => {
    mockGetMainAccount.mockReturnValue(mockAccount as MinaAccount);
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
      account: mockAccount as MinaAccount,
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
      account: mockAccount as MinaAccount,
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

    const customTxn: DeepPartial<Transaction> = { recipient: "B62qrecipient", memo: "test" };
    await estimateMaxSpendable({
      account: mockAccount as MinaAccount,
      parentAccount: undefined,
      transaction: customTxn as Transaction,
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
