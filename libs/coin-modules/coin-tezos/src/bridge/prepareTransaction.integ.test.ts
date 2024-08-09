import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import prepareTransaction from "./prepareTransaction";
import coinConfig, { TezosCoinConfig } from "../config";
import { mockConfig } from "../test/config";

describe.only("prepareTransaction", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig((): TezosCoinConfig => mockConfig as TezosCoinConfig);
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

    // When
    const newTx = await prepareTransaction(createFixtureAccount({ balance: BigNumber(10) }), tx);

    // Then
    expect(newTx.taquitoError).toEqual("proto.020-PsParisC.contract.empty_transaction");
  });
});
