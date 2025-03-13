import { buildTransaction } from "./buildTransaction";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";

const mockCreateTransaction = jest.fn().mockResolvedValue(new Uint8Array(219).fill(0x42));

jest.mock("../network", () => {
  return {
    createTransaction: () => mockCreateTransaction(),
  };
});

describe("buildTransaction", () => {
  it("returns unsigned tx bytes for given tx", async () => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    // WHEN
    const result = await buildTransaction(account, transaction);

    // THEN
    expect(mockCreateTransaction).toHaveBeenCalledTimes(1);

    const expectedResult = {
      unsigned: new Uint8Array(219).fill(0x42),
    };

    expect(result.unsigned).toEqual(expectedResult.unsigned);
  });
});
