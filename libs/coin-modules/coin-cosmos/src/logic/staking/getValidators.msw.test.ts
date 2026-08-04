import { http, HttpResponse } from "msw";
import { server, TEST_COSMOS_ENDPOINT, makeTestApi } from "../../test/msw.mock";
import { getValidators } from "./getValidators";

// Query string (?status=BOND_STATUS_BONDED&pagination.limit=200) is stripped by msw's matcher
// before comparing against the handler path, so the handler is registered without it.
const VALIDATORS = `${TEST_COSMOS_ENDPOINT}/cosmos/staking/v1beta1/validators`;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getValidators via MSW", () => {
  it("maps a bonded validator to a framework Validator", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(
      http.get(VALIDATORS, () =>
        HttpResponse.json({
          validators: [
            {
              operator_address: "cosmosvaloper1abcxyz",
              description: { moniker: "Ledger by Figment" },
              tokens: "123456789",
              commission: { commission_rates: { rate: "0.05" } },
            },
          ],
        }),
      ),
    );

    const page = await getValidators(api);

    expect(page.items).toHaveLength(1);
    const v = page.items[0];
    expect(v.address).toBe("cosmosvaloper1abcxyz");
    expect(v.name).toBe("Ledger by Figment");
    expect(v.balance).toBe(123456789n);
    expect(v.commissionRate).toBe("0.05");
    // CosmosAPI.getValidators hardcodes estimatedYearlyRewardsRate to 0.
    expect(v.apy).toBe(0);
    expect(page.next).toBeUndefined();
  });

  it("returns an empty page when no validators are bonded", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(http.get(VALIDATORS, () => HttpResponse.json({ validators: [] })));

    const page = await getValidators(api);

    expect(page.items).toEqual([]);
    expect(page.next).toBeUndefined();
  });

  // `CosmosAPI.getValidators` has no internal try/catch, so a failing request propagates out of it.
  it("throws when the validators endpoint errors", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);
    server.use(http.get(VALIDATORS, () => new HttpResponse(null, { status: 500 })));

    await expect(getValidators(api)).rejects.toThrow();
  });
});
