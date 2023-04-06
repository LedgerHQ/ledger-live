import BigNumber from "bignumber.js";
import { CosmosAccount, Transaction } from "./types";

import { calculateFees } from "./js-prepareTransaction";

const account = {
  id: "accountId",
  currency: { id: "cosmos", units: [{}, { code: "atom" }] },
  spendableBalance: new BigNumber("1000000000"),
  seedIdentifier: "seedIdentifier",
} as CosmosAccount;
const transaction = {
  mode: "send",
  recipient: "cosmosrecipientaddress",
  amount: new BigNumber("1000000"),
  memo: "test memo",
  useAllAmount: false,
} as unknown as Transaction;

describe("calculateFees", () => {
  afterEach(() => {
    calculateFees.reset();
  });
  it("should calculate fees for a transaction", async () => {
    const { estimatedFees, estimatedGas } = await calculateFees({
      account,
      transaction,
    });
    expect(estimatedFees.gt(0)).toEqual(true);
    expect(estimatedGas.gt(0)).toEqual(true);
  });

  it("should return cached result for the same inputs", async () => {
    const { estimatedFees: fees1, estimatedGas: gas1 } = await calculateFees({
      account,
      transaction,
    });
    const { estimatedFees: fees2, estimatedGas: gas2 } = await calculateFees({
      account,
      transaction,
    });
    expect(fees1).toEqual(fees2);
    expect(gas1).toEqual(gas2);
  });
});
