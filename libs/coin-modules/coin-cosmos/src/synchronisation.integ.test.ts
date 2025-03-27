import { SyncConfig } from "@ledgerhq/types-live";
import { getAccountShape } from "./synchronisation";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/lib/bridge/jsHelpers";
import { CosmosAccount } from "./types";
import BigNumber from "bignumber.js";

describe("Testing synchronisation", () => {
  it("should test", async () => {
    const addressId = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";
    const result = await getAccountShape(
      {
        address: addressId,
        currency: {
          id: "cosmos",
          units: [{}, { code: "uatom" }],
        } as CryptoCurrency,
        index: 0,
        derivationMode: "",
      } as AccountShapeInfo<CosmosAccount>,
      {} as SyncConfig,
    );
    expect(result).not.toBeUndefined();
    expect(result.balance?.isGreaterThanOrEqualTo(0)).toBeTruthy();
    expect(result.blockHeight).toBeGreaterThanOrEqual(0);
    expect(result.id).toEqual("js:2:cosmos:" + addressId + ":");
    if (result.cosmosResources && result.cosmosResources.delegatedBalance > BigNumber(0)) {
      expect(result.cosmosResources.delegatedBalance).toEqual(
        result.cosmosResources.delegations
          .map(delegation => delegation.amount)
          .reduce((accumulator, currentValue) => accumulator.plus(currentValue)),
      );
    }
  });
});
