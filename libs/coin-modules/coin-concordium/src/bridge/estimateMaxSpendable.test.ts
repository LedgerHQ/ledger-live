import BigNumber from "bignumber.js";
import { createFixtureAccount } from "../test/fixtures";
import { estimateMaxSpendable } from "./estimateMaxSpendable";

jest.mock("./prepareTransaction", () => ({
  prepareTransaction: jest.fn().mockResolvedValue({
    fee: new BigNumber(1000),
  }),
}));

jest.mock("./getTransactionStatus", () => ({
  getTransactionStatus: jest.fn().mockResolvedValue({
    estimatedFees: new BigNumber(1000),
    errors: {},
    warnings: {},
  }),
}));

jest.mock("./createTransaction", () => ({
  createTransaction: jest.fn().mockReturnValue({
    family: "concordium",
    amount: new BigNumber(0),
    recipient: "",
  }),
}));

describe("estimateMaxSpendable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return spendable balance minus estimated fees", async () => {
    // GIVEN
    const account = createFixtureAccount({ spendableBalance: new BigNumber(10000000) });

    // WHEN
    const result = await estimateMaxSpendable({ account });

    // THEN - 10000000 - 1000 = 9999000
    expect(result).toEqual(new BigNumber(9999000));
  });

  it("should return 0 when fees exceed spendable balance", async () => {
    // GIVEN
    const { getTransactionStatus } = jest.requireMock("./getTransactionStatus");
    getTransactionStatus.mockResolvedValueOnce({
      estimatedFees: new BigNumber(20000000),
      errors: {},
      warnings: {},
    });
    const account = createFixtureAccount({ spendableBalance: new BigNumber(10000000) });

    // WHEN
    const result = await estimateMaxSpendable({ account });

    // THEN
    expect(result).toEqual(new BigNumber(0));
  });

  it("should return 0 when spendable balance equals fees", async () => {
    // GIVEN
    const { getTransactionStatus } = jest.requireMock("./getTransactionStatus");
    getTransactionStatus.mockResolvedValueOnce({
      estimatedFees: new BigNumber(10000000),
      errors: {},
      warnings: {},
    });
    const account = createFixtureAccount({ spendableBalance: new BigNumber(10000000) });

    // WHEN
    const result = await estimateMaxSpendable({ account });

    // THEN
    expect(result).toEqual(new BigNumber(0));
  });

  it("should use transaction recipient if provided", async () => {
    // GIVEN
    const { prepareTransaction } = jest.requireMock("./prepareTransaction");
    const account = createFixtureAccount();
    const customRecipient = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G";

    // WHEN
    await estimateMaxSpendable({
      account,
      transaction: { recipient: customRecipient } as any,
    });

    // THEN
    expect(prepareTransaction).toHaveBeenCalledWith(
      account,
      expect.objectContaining({ recipient: customRecipient }),
    );
  });

  it("should use abandon seed address when no recipient provided", async () => {
    // GIVEN
    const { prepareTransaction } = jest.requireMock("./prepareTransaction");
    const account = createFixtureAccount();

    // WHEN
    await estimateMaxSpendable({ account });

    // THEN
    expect(prepareTransaction).toHaveBeenCalledWith(
      account,
      expect.objectContaining({
        recipient: expect.stringMatching(/^[23][a-zA-Z0-9]{49}$/),
      }),
    );
  });

  it("should set amount to 0 for fee estimation", async () => {
    // GIVEN
    const { prepareTransaction } = jest.requireMock("./prepareTransaction");
    const account = createFixtureAccount();

    // WHEN
    await estimateMaxSpendable({ account });

    // THEN
    expect(prepareTransaction).toHaveBeenCalledWith(
      account,
      expect.objectContaining({ amount: new BigNumber(0) }),
    );
  });

  it("should call createTransaction with account", async () => {
    // GIVEN
    const { createTransaction } = jest.requireMock("./createTransaction");
    const account = createFixtureAccount();

    // WHEN
    await estimateMaxSpendable({ account });

    // THEN
    expect(createTransaction).toHaveBeenCalledWith(account);
  });

  it("should merge transaction properties with created transaction", async () => {
    // GIVEN
    const { prepareTransaction } = jest.requireMock("./prepareTransaction");
    const account = createFixtureAccount();

    // WHEN
    await estimateMaxSpendable({
      account,
      transaction: { memo: "test memo" } as any,
    });

    // THEN
    expect(prepareTransaction).toHaveBeenCalledWith(
      account,
      expect.objectContaining({ memo: "test memo" }),
    );
  });

  it("should handle parentAccount parameter", async () => {
    // GIVEN
    const account = createFixtureAccount();
    const parentAccount = createFixtureAccount({ id: "parent-id" });

    // WHEN
    const result = await estimateMaxSpendable({ account, parentAccount });

    // THEN
    expect(result).toBeInstanceOf(BigNumber);
  });

  it("should handle zero spendable balance", async () => {
    // GIVEN
    const account = createFixtureAccount({ spendableBalance: new BigNumber(0) });

    // WHEN
    const result = await estimateMaxSpendable({ account });

    // THEN
    expect(result).toEqual(new BigNumber(0));
  });
});
