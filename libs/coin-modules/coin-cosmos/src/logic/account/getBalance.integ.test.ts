import coinConfig, { cosmosDefaults } from "../../config";
import { CosmosAPI } from "../../network/Cosmos";
import { getBalance } from "./getBalance";

const ADDR = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";

describe("getBalance (integ, Cosmos Hub)", () => {
  it("returns a native balance with the expected shape for a known funded address", async () => {
    const config = cosmosDefaults.cosmos;
    coinConfig.setCoinConfig(() => cosmosDefaults.cosmos);
    const api = new CosmosAPI("cosmos", undefined, cosmosDefaults.cosmos);

    const balances = await getBalance(config, api, ADDR);

    const native = balances.find(b => b.asset.type === "native");
    expect(native).not.toBeUndefined();
    expect(typeof native!.value).toBe("bigint");
    expect(native!.value >= 0n).toBe(true);
  });
});
