import { createApi } from ".";
import { BoilerplateConfig } from "../config";

describe("createApi", () => {
  it("should return every api methods", () => {
    const api = createApi({} as BoilerplateConfig);
    expect(api.broadcast).toBeDefined();
    expect(api.combine).toBeDefined();
    expect(api.craftTransaction).toBeDefined();
    expect(api.estimateFees).toBeDefined();
    expect(api.getBalance).toBeDefined();
    expect(api.lastBlock).toBeDefined();
    expect(api.listOperations).toBeDefined();
  });
});
