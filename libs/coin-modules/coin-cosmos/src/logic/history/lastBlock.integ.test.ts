import coinConfig, { cosmosDefaults } from "../../config";
import { CosmosAPI } from "../../network/Cosmos";
import { lastBlock } from "./lastBlock";

describe("lastBlock (integ, Cosmos Hub)", () => {
  it("returns a recent block with a positive height and a non-empty hash", async () => {
    coinConfig.setCoinConfig(() => cosmosDefaults.cosmos);
    const api = new CosmosAPI("cosmos", undefined, cosmosDefaults.cosmos);

    const block = await lastBlock(api);

    expect(block.height).toBeGreaterThan(0);
    expect(typeof block.hash).toBe("string");
    expect(block.hash.length).toBeGreaterThan(0);
    expect(block.time).toBeInstanceOf(Date);
  });
});
