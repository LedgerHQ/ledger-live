import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getFees } from "./api";
import { createTransaction } from "./createTransaction";
import { BigNumber } from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { Transaction } from "./types";

jest.mock("./api", () => ({
  getFees: jest.fn(),
}));

jest.mock("./createTransaction", () => ({
  createTransaction: jest.fn(),
}));

jest.mock("@ledgerhq/coin-framework/account", () => ({
  getMainAccount: jest.fn((account, parentAccount) => parentAccount || account),
  findSubAccountById: jest.fn(),
}));

const { findSubAccountById } = jest.requireMock("@ledgerhq/coin-framework/account");

describe("estimateMaxSpendable", () => {
  const mockGetFees = getFees as jest.MockedFunction<typeof getFees>;
  const mockCreateTransaction = createTransaction as jest.MockedFunction<typeof createTransaction>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateTransaction.mockReturnValue({
      family: "multiversx",
      mode: "send",
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      fees: null,
      gasLimit: 0,
    } as Transaction);
  });

  it("returns spendable balance minus fees for main account", async () => {
    const account = {
      type: "Account",
      id: "account1",
      spendableBalance: new BigNumber("10000000000000000000"), // 10 EGLD
    } as unknown as Account;

    const fees = new BigNumber("50000000000000"); // 0.00005 EGLD
    mockGetFees.mockResolvedValue(fees);

    const result = await estimateMaxSpendable({
      account,
      parentAccount: undefined,
      transaction: undefined,
    });

    expect(result).toEqual(account.spendableBalance.minus(fees));
  });

  it("returns 0 when fees exceed spendable balance", async () => {
    const account = {
      type: "Account",
      id: "account1",
      spendableBalance: new BigNumber("10000000000000"), // Very small balance
    } as unknown as Account;

    const fees = new BigNumber("50000000000000000"); // Fees higher than balance
    mockGetFees.mockResolvedValue(fees);

    const result = await estimateMaxSpendable({
      account,
      parentAccount: undefined,
      transaction: undefined,
    });

    expect(result).toEqual(new BigNumber(0));
  });

  it("returns token balance for token account", async () => {
    const tokenAccount = {
      type: "TokenAccount",
      id: "token1",
      balance: new BigNumber("5000000000000000000"), // 5 tokens
    } as unknown as TokenAccount;

    const mainAccount = {
      type: "Account",
      id: "account1",
      spendableBalance: new BigNumber("10000000000000000000"),
    } as unknown as Account;

    findSubAccountById.mockReturnValue(tokenAccount);

    const result = await estimateMaxSpendable({
      account: tokenAccount as any,
      parentAccount: mainAccount,
      transaction: undefined,
    });

    expect(result).toEqual(tokenAccount.balance);
  });

  it("applies transaction parameters to estimation", async () => {
    const account = {
      type: "Account",
      id: "account1",
      spendableBalance: new BigNumber("10000000000000000000"),
    } as unknown as Account;

    const transaction = {
      recipient: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
      mode: "send",
    } as Partial<Transaction>;

    const fees = new BigNumber("50000000000000");
    mockGetFees.mockResolvedValue(fees);

    await estimateMaxSpendable({
      account,
      parentAccount: undefined,
      transaction: transaction as Transaction,
    });

    expect(mockGetFees).toHaveBeenCalledWith(
      expect.objectContaining({
        useAllAmount: true,
        recipient: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
      }),
    );
  });
});
