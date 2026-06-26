import { getValidators } from "./getValidators";
import { createTestApiClient, errorResponse, mvxHandlers, server } from "./helpers/msw-http.mock";

const api = createTestApiClient();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const provider = (over: Record<string, unknown> = {}) => ({
  contract: "erd1qqqqqqqqqqqqqpgqp699jngundfqw07d8jzkepucvpzush6k3wvqyc44rx",
  serviceFee: "10",
  totalActiveStake: "1000000000000000000000",
  aprValue: 8.5,
  disabled: false,
  identity: { name: "Ledger Staking", url: "https://ledger.com" },
  ...over,
});

describe("getValidators (MSW integration)", () => {
  it("maps active providers from the /providers endpoint into validators", async () => {
    server.use(
      ...mvxHandlers({
        providers: () => [provider({ contract: "v1", identity: { name: "V1" } })],
      }),
    );

    const result = await getValidators(api);

    expect(result.next).toBeUndefined();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      address: "v1",
      name: "V1",
      balance: 1_000_000_000_000_000_000_000n,
      apy: 0.085,
    });
  });

  it("filters out disabled providers", async () => {
    server.use(
      ...mvxHandlers({
        providers: () => [
          provider({ contract: "active", disabled: false }),
          provider({ contract: "disabled", disabled: true }),
        ],
      }),
    );

    const result = await getValidators(api);

    expect(result.items.map(v => v.address)).toEqual(["active"]);
  });

  it("wraps HTTP errors from the /providers endpoint", async () => {
    server.use(...mvxHandlers({ providers: () => errorResponse(400) }));

    await expect(getValidators(api)).rejects.toThrow(/getValidators failed:/);
  });
});
