import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import prepareTransaction from "./prepareTransaction";
import { faker } from "@faker-js/faker";

const mockEstimateFees = jest.fn();
jest.mock("../logic", () => ({
  estimateFees: () => mockEstimateFees(),
}));

describe("prepareTransaction", () => {
  afterEach(() => {
    mockEstimateFees.mockClear();
  });

  it("returns a new Transaction with new fees", async () => {
    // GIVEN
    const fees = new BigNumber(faker.number.int(50));
    mockEstimateFees.mockResolvedValue(fees);
    const tx = createFixtureTransaction();

    // WHEN
    const newTx = await prepareTransaction(createFixtureAccount(), tx);

    // THEN
    expect(newTx.fees).toEqual(fees);
    expect(newTx).not.toBe(tx);
    expect(newTx).toMatchObject({
      amount: tx.amount,
      recipient: tx.recipient,
      mode: tx.mode,
    });
  });

  it("returns the passed transaction if fees are the same", async () => {
    // GIVEN
    const fees = new BigNumber(faker.number.int(50));
    mockEstimateFees.mockResolvedValue(fees);
    const tx = createFixtureTransaction({ fees });

    // WHEN
    const newTx = await prepareTransaction(createFixtureAccount(), tx);

    // THEN
    expect(newTx).toBe(tx);
  });
});
