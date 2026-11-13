import coinConfig, { cosmosDefaults } from "../../config";
import { CosmosAPI } from "../../network/Cosmos";
import { broadcast } from "./broadcast";

describe("broadcast (integ, Cosmos Hub)", () => {
  // Mirrors the "Broadcast" block in ../../network/Cosmos.integ.test.ts, which asserts a real
  // broadcast rejects rather than actually landing a transaction. That test builds and signs a tx
  // for a freshly-generated (uninitialized) account; here a bogus, non-decodable tx_bytes payload
  // gets the LCD to reject the same way — without ever needing a funded key or a valid signature,
  // and without pushing anything onto the chain.
  it("rejects a bogus, non-decodable transaction — never actually broadcasts", async () => {
    coinConfig.setCoinConfig(() => cosmosDefaults.cosmos);
    const api = new CosmosAPI("cosmos", undefined, cosmosDefaults.cosmos);

    await expect(broadcast(api, "deadbeef")).rejects.toThrow();
  });
});
