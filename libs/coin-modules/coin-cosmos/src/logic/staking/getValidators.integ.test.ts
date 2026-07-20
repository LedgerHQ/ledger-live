import { makeTestApi, TEST_BABYLON_ENDPOINT } from "../../test/msw.mock";
import { getValidators } from "./getValidators";

describe("getValidators (integ, Babylon)", () => {
  it("returns the bonded validator set with a well-formed address and name", async () => {
    const api = makeTestApi("babylon", TEST_BABYLON_ENDPOINT);

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
