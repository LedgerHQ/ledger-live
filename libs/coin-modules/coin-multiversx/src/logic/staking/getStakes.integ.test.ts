import { API_ENDPOINT, DELEGATION_API_ENDPOINT } from "../../test/integEndpoints";
/**
 * Integration tests — getStakes fetches delegations from the real API.
 */
import { createNetworkApi } from "../../network/api";
import { getStakes } from "./getStakes";

const ADDR = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";

describe("getStakes (integration)", () => {
  const api = createNetworkApi(API_ENDPOINT, DELEGATION_API_ENDPOINT);

  it("returns a page (not error) for any address", async () => {
    const result = await getStakes(api, ADDR);
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("returns empty page for pristine address", async () => {
    const pristine = "erd1x0djklnd7yvmvhna6fwp0chmjjkx6vhke63kqfqnvy5hrdtq3p0sq63ugy";
    const result = await getStakes(api, pristine);
    expect(result.items).toHaveLength(0);
  });
});
