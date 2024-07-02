import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import prepareTransaction from "./prepareTransaction";
import { faker } from "@faker-js/faker";

jest.mock("../logic", () => ({
  validateRecipient: jest.fn(),
}));

describe("prepareTransaction", () => {
  it.only("returns error the same transaction when amount below 0", async () => {
    // Given
    const tx = createFixtureTransaction({ amount: BigNumber(faker.number.int({ max: 0 })) });

    // When
    const newTx = await prepareTransaction(createFixtureAccount(), tx);

    // Then
    expect(newTx).toBe(tx);
  });

  // it("returns a new Transaction with new fees", async () => {
  //   // Given
  //   const fees = new BigNumber(faker.number.int(50));
  //   mockEstimateFees.mockResolvedValue(fees);
  //   const tx = createFixtureTransaction();

  //   // When
  //   const newTx = await prepareTransaction(createFixtureAccount(), tx);

  //   // Then
  //   expect(mockCraftTransaction).toHaveBeenCalledTimes(1); // Check that Tx is concerted to core Tx.
  //   expect(mockEstimateFees).toHaveBeenCalledTimes(1);
  //   expect(newTx.fees).toEqual(fees);
  //   expect(newTx).not.toBe(tx);
  //   expect(newTx).toMatchObject({
  //     amount: tx.amount,
  //     recipient: tx.recipient,
  //     mode: tx.mode,
  //   });
  // });

  // it("returns the passed transaction if fees are the same", async () => {
  //   // Given
  //   const fees = new BigNumber(faker.number.int(50));
  //   mockEstimateFees.mockResolvedValue(fees);
  //   const tx = createFixtureTransaction({ fees });

  //   // When
  //   const newTx = await prepareTransaction(createFixtureAccount(), tx);

  //   // Then
  //   expect(newTx).toBe(tx);
  // });
});
