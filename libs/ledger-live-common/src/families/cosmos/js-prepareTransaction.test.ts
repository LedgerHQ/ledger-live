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
  // TODO: add test that checks that gas/fee estimation is higher than simulate call response

  it("should calculate fees for a transaction", async () => {
    const { estimatedFees, estimatedGas } = await calculateFees({
      account,
      transaction,
    });
    expect(estimatedFees.gt(0)).toEqual(true);
    expect(estimatedGas.gt(0)).toEqual(true);
  });
});
