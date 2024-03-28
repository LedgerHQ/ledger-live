import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../types/model.fixture";
import prepareTransaction from "./prepareTransaction";
import { faker } from "@faker-js/faker";

const mockEstimatedFees = jest.fn();
jest.mock("../logic", () => ({
  estimatedFees: () => mockEstimatedFees(),
}));

describe("prepareTransaction", () => {
  afterEach(() => {
    mockEstimatedFees.mockClear();
  });

  it("returns a new Transaction with new fees", async () => {
    // Given
    const fees = new BigNumber(faker.number.int(50));
    mockEstimatedFees.mockResolvedValue(fees);
    const tx = createFixtureTransaction();

    // When
    const newTx = await prepareTransaction(createFixtureAccount(), tx);

    // Then
    expect(mockEstimatedFees).toHaveBeenCalledTimes(1);
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
    const fees = new BigNumber(faker.number.int(50));
    mockEstimatedFees.mockResolvedValue(fees);
    const tx = createFixtureTransaction({ fees });

    // When
    const newTx = await prepareTransaction(createFixtureAccount(), tx);

    // Then
    expect(newTx).toBe(tx);
  });
});
