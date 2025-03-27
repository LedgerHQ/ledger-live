import { SyncConfig } from "@ledgerhq/types-live";
import { getAccountShape } from "./synchronisation";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/lib/bridge/jsHelpers";
import { CosmosAccount } from "./types";

describe("Testing synchronisation", () => {
  it("should test", async () => {
    const result = await getAccountShape(
      {
        address: "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq",
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
  });
});
