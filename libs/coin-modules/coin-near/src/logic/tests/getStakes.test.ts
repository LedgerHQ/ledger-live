import { mockNearContext } from "../../test/context";
import { http, HttpResponse } from "msw";
import { setMockCoinConfig } from "../../test/coinConfig";
import { mockServer, NEAR_BASE_URL_MOCKED } from "../../network/node.mock";
import { getStakes } from "../getStakes";

const ADDRESS = "delegator.near";
const VALIDATOR_ID = "astro-stakers.poolv1.near";

const viewResult = (value: unknown) => ({
  jsonrpc: "2.0",
  id: "id",
  result: {
    result: Array.from(Buffer.from(JSON.stringify(value))),
    logs: [],
    block_height: 1,
    block_hash: "DsWyc6swGSDezgvweB561FLbL1nsBsU3QJtZFLHq79Ru",
  },
});

const mockPool = (views: Record<string, unknown>): void => {
  mockServer.use(
    http.get(`${NEAR_BASE_URL_MOCKED}/v3/kitwallet/staking-deposits/:address`, () =>
      HttpResponse.json([{ deposit: "1000000000000000000000000", validator_id: VALIDATOR_ID }]),
    ),
    http.post(NEAR_BASE_URL_MOCKED, async ({ request }) => {
      const body = (await request.json()) as { params: { method_name?: string } };
      const methodName = body.params.method_name as string;
      return HttpResponse.json(viewResult(views[methodName]));
    }),
  );
};

describe("getStakes (MSW)", () => {
  beforeAll(() => {
    setMockCoinConfig();
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => mockServer.resetHandlers());
  afterAll(() => mockServer.close());

  it("reports an active delegation as a single unpaginated page", async () => {
    mockPool({
      get_account_staked_balance: "1000000000000000000000000",
      get_account_unstaked_balance: "0",
      is_account_unstaked_balance_available: false,
    });

    const page = await getStakes(mockNearContext, ADDRESS);

    expect(page.next).toBeUndefined();
    expect(page.items).toEqual([
      {
        uid: `${ADDRESS}:${VALIDATOR_ID}:staked`,
        address: ADDRESS,
        delegate: VALIDATOR_ID,
        state: "active",
        actions: ["undelegate"],
        asset: { type: "native" },
        amount: 1_000_000_000_000_000_000_000_000n,
      },
    ]);
  });

  it("returns an empty page rather than undefined items when the account has no deposits", async () => {
    mockServer.use(
      http.get(`${NEAR_BASE_URL_MOCKED}/v3/kitwallet/staking-deposits/:address`, () =>
        HttpResponse.json([]),
      ),
    );

    const page = await getStakes(mockNearContext, ADDRESS);

    expect(page.items).toEqual([]);
  });
});
