import { getStakes } from "./getStakes";
import { createTestApiClient, errorResponse, mvxHandlers, server } from "./helpers/msw-http.mock";

const api = createTestApiClient();
const ADDRESS = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
const CONTRACT = "erd1qqqqqqqqqqqqqpgqp699jngundfqw07d8jzkepucvpzush6k3wvqyc44rx";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getStakes (MSW integration)", () => {
  it("maps delegations from the delegation endpoint into a Page of stakes", async () => {
    server.use(
      ...mvxHandlers({
        delegations: () => [
          {
            address: ADDRESS,
            contract: CONTRACT,
            userActiveStake: "2000000000000000000",
            claimableRewards: "50000000000000000",
            userUnBondable: "0",
            userUndelegatedList: [],
          },
        ],
      }),
    );

    const result = await getStakes(api, ADDRESS);

    expect(result.next).toBeUndefined();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      uid: `${ADDRESS}-${CONTRACT}`,
      address: ADDRESS,
      delegate: CONTRACT,
      state: "active",
      amountDeposited: 2_000_000_000_000_000_000n,
      amountRewarded: 50_000_000_000_000_000n,
    });
  });

  it("returns an empty page when the account has no delegations", async () => {
    server.use(...mvxHandlers({ delegations: () => [] }));

    const result = await getStakes(api, ADDRESS);

    expect(result.items).toEqual([]);
    expect(result.next).toBeUndefined();
  });

  it("wraps HTTP errors from the delegation endpoint", async () => {
    server.use(...mvxHandlers({ delegations: () => errorResponse(400) }));

    await expect(getStakes(api, ADDRESS)).rejects.toThrow(
      new RegExp(`Failed to fetch delegations for ${ADDRESS}`),
    );
  });

  it("throws for an invalid address without hitting the network", async () => {
    await expect(getStakes(api, "nope")).rejects.toThrow(/Invalid MultiversX address/);
  });
});
