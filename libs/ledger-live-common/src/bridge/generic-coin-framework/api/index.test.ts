import { getCoinModuleApi } from "./index";

describe("getCoinModuleApi", () => {
  it("resolves hedera's local coin module api", async () => {
    const api = await getCoinModuleApi("hedera", "local");

    expect(api.craftTransaction).toBeInstanceOf(Function);
    expect(api.getBalance).toBeInstanceOf(Function);
  });
});
