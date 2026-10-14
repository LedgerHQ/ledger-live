import BigNumber from "bignumber.js";
import { createMockPolkadotContext } from "../test/config.fixture";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import { buildPrepareTransaction } from "./prepareTransaction";

const mockCraftTransaction = jest.fn();
const mockEstimateFees = jest.fn();
jest.mock("../logic", () => ({
  estimateFees: () => mockEstimateFees(),
  craftTransaction: () => mockCraftTransaction(),
}));

describe("prepareTransaction", () => {
  const prepareTransaction = buildPrepareTransaction(createMockPolkadotContext());

  afterEach(() => {
    mockCraftTransaction.mockClear();
    mockEstimateFees.mockClear();
  });

  it("returns a new Transaction with new fees", async () => {
    // Given
    const fees = new BigNumber(42);
    mockEstimateFees.mockResolvedValue(fees);
    const tx = createFixtureTransaction();

    // When
    const newTx = await prepareTransaction(createFixtureAccount(), tx);

    // Then
    expect(mockCraftTransaction).toHaveBeenCalledTimes(1); // Check that Tx is concerted to core Tx.
    expect(mockEstimateFees).toHaveBeenCalledTimes(1);
    expect(newTx.fees).toEqual(fees);
    expect(newTx).not.toBe(tx);
    expect(newTx).toMatchObject({
      amount: tx.amount,
      recipient: tx.recipient,
      mode: tx.mode,
    });
  });

  it("returns the passed transaction if fees are the same", async () => {
    // Given
    const fees = new BigNumber(42);
    mockEstimateFees.mockResolvedValue(fees);
    const tx = createFixtureTransaction({ fees });

    // When
    const newTx = await prepareTransaction(createFixtureAccount(), tx);

    // Then
    expect(newTx).toBe(tx);
  });
});
