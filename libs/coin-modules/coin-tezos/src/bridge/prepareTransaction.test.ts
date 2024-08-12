import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import prepareTransaction from "./prepareTransaction";
import { faker } from "@faker-js/faker";
import coinConfig, { TezosCoinConfig } from "../config";
import { mockConfig } from "../test/config";

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
  beforeAll(() => {
    coinConfig.setCoinConfig((): TezosCoinConfig => mockConfig as TezosCoinConfig);
  });

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

  it("returns new transaction with estimated fees by TezosToolkit", async () => {
    // Given
    const tx = createFixtureTransaction({
      amount: BigNumber(200),
      recipient: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
    });
    const tezosEstimate = {
      suggestedFeeMutez: faker.number.int(20),
      gasLimit: faker.number.int(20),
      storageLimit: faker.number.int(20),
    };
    mockTezosEstimate.mockResolvedValue(tezosEstimate);

    // When
    const newTx = await prepareTransaction(createFixtureAccount({ balance: BigNumber(1_000) }), tx);

    // Then
    expect(newTx).toEqual({
      ...tx,
      fees: new BigNumber(tezosEstimate.suggestedFeeMutez),
      estimatedFees: new BigNumber(tezosEstimate.suggestedFeeMutez),
      gasLimit: new BigNumber(tezosEstimate.gasLimit),
      storageLimit: new BigNumber(tezosEstimate.storageLimit),
    });
  });

  it("returns new transaction with estimated fees by TezosToolkit when useAllAmount", async () => {
    // Given
    const tx = createFixtureTransaction({
      amount: BigNumber(200),
      recipient: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
      useAllAmount: true,
    });
    const tezosEstimate = {
      suggestedFeeMutez: faker.number.int(20),
      gasLimit: faker.number.int(20),
      storageLimit: faker.number.int(20),
      opSize: faker.number.int(20),
      burnFeeMutez: faker.number.int(20),
    };
    mockTezosEstimate.mockResolvedValue(tezosEstimate);
    const account = createFixtureAccount({ balance: BigNumber(1_000) });

    // When
    const newTx = await prepareTransaction(account, tx);

    // Then
    const gasLimit = 500; // hardcoded in the function
    const computedFees = new BigNumber(
      tezosEstimate.suggestedFeeMutez + tezosEstimate.opSize + gasLimit * 0.1,
    );
    expect(newTx).toEqual({
      ...tx,
      fees: computedFees,
      estimatedFees: computedFees,
      gasLimit: new BigNumber(tezosEstimate.gasLimit + gasLimit),
      storageLimit: new BigNumber(tezosEstimate.storageLimit),
      amount: account.balance.minus(
        tezosEstimate.opSize +
          gasLimit * 0.1 +
          tezosEstimate.suggestedFeeMutez +
          tezosEstimate.burnFeeMutez,
      ),
    });
  });

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
