import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import prepareTransaction from "./prepareTransaction";
import { faker } from "@faker-js/faker";

const mockTezosEstimate = jest.fn();
jest.mock("../logic/tezosToolkit", () => ({
  getTezosToolkit: () => ({
    setProvider: jest.fn(),
    estimate: {
      transfer: () => mockTezosEstimate(),
    },
  }),
}));

describe("prepareTransaction", () => {
  beforeEach(() => {
    mockTezosEstimate.mockReset();
  });

  it("returns the same transaction when account balance is 0", async () => {
    // Given
    const tx = createFixtureTransaction({ amount: BigNumber(0) });

    // When
    const newTx = await prepareTransaction(createFixtureAccount(), tx);

    // Then
    expect(newTx).toBe(tx);
  });

  it("returns error when amount is 0", async () => {
    // Given
    const tx = createFixtureTransaction({
      amount: BigNumber(0),
      recipient: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
    });
    mockTezosEstimate.mockRejectedValue({
      id: "proto.020-PsParisC.contract.empty_transaction",
    });

    // When
    const newTx = await prepareTransaction(createFixtureAccount({ balance: BigNumber(10) }), tx);

    // Then
    expect(newTx.taquitoError).toEqual("proto.020-PsParisC.contract.empty_transaction");
  });

  it("returns new transaction with estimated value by TezosToolkit", async () => {
    // Given
    const tx = createFixtureTransaction({
      amount: BigNumber(2),
      recipient: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
    });
    const tezosEstimate = {
      suggestedFeeMutez: faker.number.int(20),
      gasLimit: faker.number.int(20),
      storageLimit: faker.number.int(20),
    };
    mockTezosEstimate.mockResolvedValue(tezosEstimate);

    // When
    const newTx = await prepareTransaction(createFixtureAccount({ balance: BigNumber(10) }), tx);

    // Then
    expect(newTx).toEqual({
      ...tx,
      fees: new BigNumber(tezosEstimate.suggestedFeeMutez),
      gasLimit: new BigNumber(tezosEstimate.gasLimit),
      storageLimit: new BigNumber(tezosEstimate.storageLimit),
    });
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
