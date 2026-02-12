import { faker } from "@faker-js/faker";
import BigNumber from "bignumber.js";
import { DEFAULT_COIN_TYPE } from "../network/sdk";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import prepareTransaction from "./prepareTransaction";

const mockGetFeesForTransaction = jest.fn();
jest.mock("./getFeesForTransaction", () => ({
  __esModule: true,
  default: () => mockGetFeesForTransaction(),
}));

const TEST_TOKEN_COIN_TYPE = "0x0::sui::TEST_TOKEN";

// Mock findSubAccountById for testing token transactions
jest.mock("@ledgerhq/coin-framework/account/index", () => ({
  findSubAccountById: jest.fn().mockImplementation((account, subAccountId) => {
    if (subAccountId === "tokenSubAccountId") {
      return {
        token: {
          id: "tokenSubAccountId",
          contractAddress: TEST_TOKEN_COIN_TYPE,
        },
      };
    }
    return null;
  }),
}));

// Mock calculateAmount
const mockCalculateAmount = jest.fn();
jest.mock("./utils", () => ({
  calculateAmount: () => mockCalculateAmount(),
}));

describe("prepareTransaction", () => {
  afterEach(() => {
    mockGetFeesForTransaction.mockClear();
    mockCalculateAmount.mockClear();
  });

  it("returns a new Transaction with new fees", async () => {
    // GIVEN
    const fees = new BigNumber(faker.number.int({ min: 1, max: 50 }));
    mockGetFeesForTransaction.mockResolvedValue(fees);
    const tx = createFixtureTransaction();

    // WHEN
    const newTx = await prepareTransaction(createFixtureAccount(), tx);

    // THEN
    expect(newTx.fees).toEqual(fees);
    expect(newTx).not.toBe(tx);
    expect(newTx).toMatchObject({
      amount: tx.amount,
      recipient: tx.recipient,
      mode: "send",
      coinType: DEFAULT_COIN_TYPE,
    });
  });

  it("calculates amount when useAllAmount is true", async () => {
    // GIVEN
    const fees = new BigNumber(faker.number.int({ min: 1, max: 50 }));
    const calculatedAmount = new BigNumber(faker.number.int({ min: 1000, max: 5000 }));
    mockGetFeesForTransaction.mockResolvedValue(fees);
    mockCalculateAmount.mockReturnValue(calculatedAmount);
    const tx = createFixtureTransaction({ useAllAmount: true });

    // WHEN
    const newTx = await prepareTransaction(createFixtureAccount(), tx);

    // THEN
    expect(mockCalculateAmount).toHaveBeenCalledTimes(1);
    expect(newTx.amount).toEqual(calculatedAmount);
    expect(newTx.fees).toEqual(fees);
  });

  it("sets mode to token.send and updates coinType for token transactions", async () => {
    // GIVEN
    const fees = new BigNumber(faker.number.int({ min: 1, max: 50 }));
    mockGetFeesForTransaction.mockResolvedValue(fees);
    const tx = createFixtureTransaction({
      subAccountId: "tokenSubAccountId",
      coinType: TEST_TOKEN_COIN_TYPE,
    });

    // WHEN
    const newTx = await prepareTransaction(createFixtureAccount(), tx);

    // THEN
    expect(newTx.mode).toEqual("token.send");
    expect(newTx.coinType).toEqual(TEST_TOKEN_COIN_TYPE);
    expect(newTx.fees).toEqual(fees);
  });

  it("uses default fee of 0 when fee estimation fails", async () => {
    // GIVEN
    mockGetFeesForTransaction.mockRejectedValue(new Error("Fee estimation failed"));
    const tx = createFixtureTransaction();

    // WHEN
    const newTx = await prepareTransaction(createFixtureAccount(), tx);

    // THEN
    expect(newTx.fees).toEqual(new BigNumber(0));
  });
});
