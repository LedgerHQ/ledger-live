import { http, HttpResponse } from "msw";
import { setCoinConfig } from "../config";
import { getGasPrice, getStakingPositions, getValidators } from "./node";
import { mockServer, NEAR_BASE_URL_MOCKED } from "./node.mock";

const RPC_GAS_PRICE = "123000000";
const ADDRESS = "delegator.near";
const VALIDATOR_ID = "astro-stakers.poolv1.near";

type IndexerValidator = {
  account_id: string;
  current_epoch_stake: string | null;
  fee_numerator: number | null;
  fee_denominator: number | null;
};

const validator = (overrides: Partial<IndexerValidator> = {}): IndexerValidator => ({
  account_id: VALIDATOR_ID,
  current_epoch_stake: "31516203410952749364980772561846",
  fee_numerator: 1,
  fee_denominator: 100,
  ...overrides,
});

const page = (count: number, prefix: string): IndexerValidator[] =>
  Array.from({ length: count }, (_, index) => validator({ account_id: `${prefix}-${index}.near` }));

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

const mockRpc = (views: Record<string, unknown> = {}): void => {
  mockServer.use(
    http.post(NEAR_BASE_URL_MOCKED, async ({ request }) => {
      const body = (await request.json()) as {
        method: string;
        params: { request_type?: string; method_name?: string };
      };

      if (body.method === "gas_price") {
        return HttpResponse.json({
          jsonrpc: "2.0",
          id: "id",
          result: { gas_price: RPC_GAS_PRICE },
        });
      }

      if (body.params?.request_type === "call_function") {
        const methodName = body.params.method_name as string;
        return HttpResponse.json(viewResult(views[methodName]));
      }

      return HttpResponse.json({ jsonrpc: "2.0", id: "id", result: {} });
    }),
  );
};

const mockStats = (data: { gas_price: string | null } | null): void => {
  mockServer.use(http.get(`${NEAR_BASE_URL_MOCKED}/v3/stats`, () => HttpResponse.json({ data })));
};

describe("node api (indexer-backed calls)", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: { type: "active" },
      infra: {
        API_NEAR_PRIVATE_NODE: NEAR_BASE_URL_MOCKED,
        API_NEAR_PUBLIC_NODE: NEAR_BASE_URL_MOCKED,
        API_NEAR_INDEXER: NEAR_BASE_URL_MOCKED,
        API_NEARBLOCKS_INDEXER: NEAR_BASE_URL_MOCKED,
      },
    }));

    mockServer.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    getValidators.reset();
  });

  afterEach(() => {
    mockServer.resetHandlers();
  });

  afterAll(() => {
    mockServer.close();
  });

  describe("getGasPrice", () => {
    it("reads the gas price from the v3 stats envelope", async () => {
      let requestedPath: string | undefined;
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/stats`, ({ request }) => {
          requestedPath = new URL(request.url).pathname;
          return HttpResponse.json({ data: { gas_price: "100000000" } });
        }),
      );

      const gasPrice = await getGasPrice();

      expect(requestedPath).toBe("/v3/stats");
      expect(gasPrice).toBe("100000000");
    });

    it("falls back to the node RPC when the indexer gas price is null", async () => {
      mockStats({ gas_price: null });
      mockRpc();

      const gasPrice = await getGasPrice();

      expect(gasPrice).toBe(RPC_GAS_PRICE);
    });

    it("falls back to the node RPC when the envelope data is null", async () => {
      mockStats(null);
      mockRpc();

      const gasPrice = await getGasPrice();

      expect(gasPrice).toBe(RPC_GAS_PRICE);
    });

    it("falls back to the node RPC when the indexer reports an empty gas price", async () => {
      mockStats({ gas_price: "" });
      mockRpc();

      const gasPrice = await getGasPrice();

      expect(gasPrice).toBe(RPC_GAS_PRICE);
    });

    it("reports the node error when the fallback cannot read a gas price either", async () => {
      mockStats(null);
      mockServer.use(
        http.post(NEAR_BASE_URL_MOCKED, () =>
          HttpResponse.json({
            jsonrpc: "2.0",
            id: "id",
            error: { message: "node unavailable" },
          }),
        ),
      );

      await expect(getGasPrice()).rejects.toThrow("node unavailable");
    });
  });

  describe("getStakingPositions", () => {
    it("discovers delegated validators through the v3 kitwallet endpoint", async () => {
      let requestedPath: string | undefined;
      mockServer.use(
        http.get(
          `${NEAR_BASE_URL_MOCKED}/v3/kitwallet/staking-deposits/:address`,
          ({ request }) => {
            requestedPath = new URL(request.url).pathname;
            return HttpResponse.json([
              { deposit: "1000000000000000000000000", validator_id: VALIDATOR_ID },
            ]);
          },
        ),
      );
      mockRpc({
        get_account_staked_balance: "1000000000000000000000000",
        get_account_unstaked_balance: "0",
        is_account_unstaked_balance_available: false,
      });

      const { stakingPositions, totalStaked } = await getStakingPositions(ADDRESS);

      expect(requestedPath).toBe(`/v3/kitwallet/staking-deposits/${ADDRESS}`);
      expect(totalStaked.toFixed()).toBe("1000000000000000000000000");
      expect(stakingPositions).toHaveLength(1);
      expect(stakingPositions[0].validatorId).toBe(VALIDATOR_ID);
    });

    it("handles an account with no deposits", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/kitwallet/staking-deposits/:address`, () =>
          HttpResponse.json([]),
        ),
      );
      mockRpc();

      const { stakingPositions, totalStaked } = await getStakingPositions(ADDRESS);

      expect(stakingPositions).toEqual([]);
      expect(totalStaked.toFixed()).toBe("0");
    });

    it("reports an unstaked balance as available once the node says it is withdrawable", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/kitwallet/staking-deposits/:address`, () =>
          HttpResponse.json([{ deposit: "1000000000000000000000000", validator_id: VALIDATOR_ID }]),
        ),
      );
      mockRpc({
        get_account_staked_balance: "0",
        get_account_unstaked_balance: "2000000000000000000000000",
        is_account_unstaked_balance_available: true,
      });

      const { stakingPositions, totalAvailable, totalPending } = await getStakingPositions(ADDRESS);

      expect(totalAvailable.toFixed()).toBe("2000000000000000000000000");
      expect(totalPending.toFixed()).toBe("0");
      expect(stakingPositions[0].available.toFixed()).toBe("2000000000000000000000000");
    });

    it("reports an unstaked balance as pending while it is still locked", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/kitwallet/staking-deposits/:address`, () =>
          HttpResponse.json([{ deposit: "1000000000000000000000000", validator_id: VALIDATOR_ID }]),
        ),
      );
      mockRpc({
        get_account_staked_balance: "0",
        get_account_unstaked_balance: "3000000000000000000000000",
        is_account_unstaked_balance_available: false,
      });

      const { totalAvailable, totalPending } = await getStakingPositions(ADDRESS);

      expect(totalAvailable.toFixed()).toBe("0");
      expect(totalPending.toFixed()).toBe("3000000000000000000000000");
    });
  });

  describe("getValidators", () => {
    it("maps the flat snake_case v3 shape", async () => {
      let requestedUrl: URL | undefined;
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, ({ request }) => {
          requestedUrl = new URL(request.url);
          return HttpResponse.json({ data: [validator()] });
        }),
      );

      const validators = await getValidators({ total: 200 });

      expect(requestedUrl?.pathname).toBe("/v3/validators");
      expect(requestedUrl?.searchParams.get("limit")).toBe("100");
      expect(validators).toEqual([
        {
          account_id: VALIDATOR_ID,
          stake: "31516203410952749364980772561846",
          commission: 1,
        },
      ]);
    });

    it("computes the same commission percentage as the previous fee shape", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () =>
          HttpResponse.json({
            data: [validator({ fee_numerator: 7, fee_denominator: 100 })],
          }),
        ),
      );

      const [mapped] = await getValidators({ total: 200 });

      expect(mapped.commission).toBe(7);
    });

    it("walks the cursor until the requested total is collected", async () => {
      const cursor = "eyJhY2NvdW50X2lkIjoid2Fja2F6b25nLnBvb2x2MS5uZWFyIn0=";
      const receivedCursors: (string | null)[] = [];

      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, ({ request }) => {
          const next = new URL(request.url).searchParams.get("next");
          receivedCursors.push(next);

          if (!next) {
            return HttpResponse.json({
              data: page(100, "first"),
              meta: { next_page: cursor },
            });
          }

          return HttpResponse.json({ data: page(100, "second") });
        }),
      );

      const validators = await getValidators({ total: 200 });

      expect(validators).toHaveLength(200);
      expect(receivedCursors).toEqual([null, cursor]);
      expect(validators[0].account_id).toBe("first-0.near");
      expect(validators[100].account_id).toBe("second-0.near");
    });

    it("url-encodes the cursor so an opaque base64 token survives the round trip", async () => {
      const cursor = "YWJjZGVm+Z2hpamts/bW5vcA==";
      const receivedCursors: (string | null)[] = [];

      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, ({ request }) => {
          const next = new URL(request.url).searchParams.get("next");
          receivedCursors.push(next);

          if (!next) {
            return HttpResponse.json({ data: page(100, "first"), meta: { next_page: cursor } });
          }

          return HttpResponse.json({ data: page(100, "second") });
        }),
      );

      await getValidators({ total: 200 });

      expect(receivedCursors[1]).toBe(cursor);
    });

    it("stops when the indexer returns no further cursor", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () =>
          HttpResponse.json({ data: page(100, "only") }),
        ),
      );

      const validators = await getValidators({ total: 200 });

      expect(validators).toHaveLength(100);
    });

    it("never returns more than the requested total", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, ({ request }) => {
          const next = new URL(request.url).searchParams.get("next");

          if (!next) {
            return HttpResponse.json({ data: page(100, "first"), meta: { next_page: "cursor" } });
          }

          return HttpResponse.json({ data: page(100, "second") });
        }),
      );

      const validators = await getValidators({ total: 150 });

      expect(validators).toHaveLength(150);
    });

    it("returns no validators when the envelope data is null", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () => HttpResponse.json({ data: null })),
      );

      const validators = await getValidators({ total: 200 });

      expect(validators).toEqual([]);
    });

    it("defaults the stake when the current epoch stake is null", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () =>
          HttpResponse.json({ data: [validator({ current_epoch_stake: null })] }),
        ),
      );

      const [mapped] = await getValidators({ total: 200 });

      expect(mapped.stake).toBe("0");
    });

    it.each([
      ["a null denominator", { fee_denominator: null }],
      ["a null numerator", { fee_numerator: null }],
      ["a zero denominator", { fee_denominator: 0 }],
    ])("returns a zero commission for %s", async (_label, overrides) => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () =>
          HttpResponse.json({ data: [validator(overrides)] }),
        ),
      );

      const [mapped] = await getValidators({ total: 200 });

      expect(mapped.commission).toBe(0);
    });

    it("stops on an empty page even if the indexer keeps advertising a cursor", async () => {
      let requests = 0;

      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () => {
          requests += 1;
          return HttpResponse.json({ data: [], meta: { next_page: "same-cursor-every-time" } });
        }),
      );

      const validators = await getValidators({ total: 200 });

      expect(requests).toBe(1);
      expect(validators).toEqual([]);
    });

    it("never issues more requests than the pages needed for the total", async () => {
      let requests = 0;

      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, () => {
          requests += 1;
          return HttpResponse.json({
            data: [validator({ account_id: `v${requests}.near` })],
            meta: { next_page: "same-cursor-every-time" },
          });
        }),
      );

      const validators = await getValidators({ total: 200 });

      expect(requests).toBe(2);
      expect(validators).toHaveLength(2);
    });

    it("requests only the outstanding validators on each page", async () => {
      const requestedLimits: (string | null)[] = [];

      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, ({ request }) => {
          const url = new URL(request.url);
          requestedLimits.push(url.searchParams.get("limit"));

          if (!url.searchParams.get("next")) {
            return HttpResponse.json({ data: page(100, "first"), meta: { next_page: "cursor" } });
          }

          return HttpResponse.json({ data: page(50, "second") });
        }),
      );

      const validators = await getValidators({ total: 150 });

      expect(requestedLimits).toEqual(["100", "50"]);
      expect(validators).toHaveLength(150);
    });

    it("caches per requested total rather than serving one total's result to another", async () => {
      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, ({ request }) => {
          const limit = Number(new URL(request.url).searchParams.get("limit"));
          return HttpResponse.json({ data: page(limit, "any") });
        }),
      );

      const five = await getValidators({ total: 5 });
      const ten = await getValidators({ total: 10 });

      expect(five).toHaveLength(5);
      expect(ten).toHaveLength(10);
    });

    it("issues a single request when the total fits in one page", async () => {
      const requestedLimits: (string | null)[] = [];

      mockServer.use(
        http.get(`${NEAR_BASE_URL_MOCKED}/v3/validators`, ({ request }) => {
          requestedLimits.push(new URL(request.url).searchParams.get("limit"));
          return HttpResponse.json({ data: page(20, "only"), meta: { next_page: "cursor" } });
        }),
      );

      const validators = await getValidators({ total: 20 });

      expect(requestedLimits).toEqual(["20"]);
      expect(validators).toHaveLength(20);
    });
  });
});
