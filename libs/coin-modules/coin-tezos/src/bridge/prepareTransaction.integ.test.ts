import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import prepareTransaction from "./prepareTransaction";
import coinConfig, { TezosCoinConfig } from "../config";

describe.only("prepareTransaction", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(
      (): TezosCoinConfig => ({
        status: { type: "active" },
        baker: {
          url: "https://tezos-bakers.api.live.ledger.com",
        },
        explorer: {
          url: "https://xtz-tzkt-explorer.api.live.ledger.com",
          maxTxQuery: 100,
        },
        node: {
          url: "https://xtz-node.api.live.ledger.com",
        },
      }),
    );
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
