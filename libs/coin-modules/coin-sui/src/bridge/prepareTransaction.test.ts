import { NotEnoughBalance, NotEnoughBalanceFees } from "@ledgerhq/errors";
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
jest.mock("@ledgerhq/ledger-wallet-framework/account/index", () => ({
  findSubAccountById: jest.fn().mockImplementation((_account, subAccountId) => {
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
    const fees = new BigNumber(42);
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
    expect(mockCalculateAmount).not.toHaveBeenCalled();
  });

  it("calculates amount when useAllAmount is true", async () => {
    // GIVEN
    const fees = new BigNumber(42);
    const calculatedAmount = new BigNumber(2000);
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
    const fees = new BigNumber(42);
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
    expect(newTx.tokenId).toEqual("tokenSubAccountId");
  });

  it("rejects when fee estimation fails with an unrecognised error", async () => {
    // GIVEN
    mockGetFeesForTransaction.mockRejectedValue(new Error("fee estimation failed"));
    const tx = createFixtureTransaction();

    // WHEN / THEN
    await expect(prepareTransaction(createFixtureAccount(), tx)).rejects.toThrow();
  });

  it("rejects when fee estimation fails with NotEnoughBalanceFees", async () => {
    // GIVEN — gas-shortage errors must propagate so the UI can act on them
    mockGetFeesForTransaction.mockRejectedValue(new NotEnoughBalanceFees());
    const tx = createFixtureTransaction();

    // WHEN / THEN
    await expect(prepareTransaction(createFixtureAccount(), tx)).rejects.toThrow(
      NotEnoughBalanceFees,
    );
  });

  it("rejects when fee estimation fails with NotEnoughBalance", async () => {
    // GIVEN — amount > balance: error propagates so the caller can act on it
    mockGetFeesForTransaction.mockRejectedValue(new NotEnoughBalance());
    const tx = createFixtureTransaction();

    // WHEN / THEN
    await expect(prepareTransaction(createFixtureAccount(), tx)).rejects.toThrow(NotEnoughBalance);
  });
});
