import { cardApi } from "@shared/api-services";
import { cardManagementApi } from "./api";

describe("cardManagementApi configuration", () => {
  it("is the Card service api, mutated in place by injectEndpoints", () => {
    expect(cardManagementApi).toBe(cardApi);
    expect(cardManagementApi.reducerPath).toBe("cardApi");
  });

  it("declares no endpoints of its own yet", () => {
    expect(Object.keys(cardManagementApi.endpoints)).toHaveLength(0);
  });
});
