import coinConfig, { cosmosDefaults } from "../../config";
import { CosmosAPI } from "../../network/Cosmos";
import { getValidators } from "./getValidators";

describe("getValidators (integ, Babylon)", () => {
  it("returns the bonded validator set with a well-formed address and name", async () => {
    coinConfig.setCoinConfig(() => cosmosDefaults.babylon);
    const api = new CosmosAPI("babylon", undefined, cosmosDefaults.babylon);

    const page = await getValidators(api);

    expect(page.items.length).toBeGreaterThan(0);
    for (const v of page.items) {
      expect(v.address).toMatch(/^bbnvaloper1/);
      expect(typeof v.name).toBe("string");
      expect(v.name.length).toBeGreaterThan(0);
    }
    expect(page.next).toBeUndefined();
  });
});
