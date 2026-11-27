import { configureStore } from "@reduxjs/toolkit";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { earnApi, earnApiExtra } from "@shared/api-services";
import { EARN_POSITIONS_TAG, earnPositionsApi, useGetEarnPositionsQuery } from "./api";
import { UNREADABLE_ROW_FAILURE } from "./internals/stakes";
import {
  LEDGER_BY_FIGMENT_VOTE_ACCOUNT,
  OTHER_OWNER_ADDRESS,
  OWNER_ADDRESS,
  STAKE_ACCOUNT_A,
  STAKE_ACCOUNT_B,
  batchStakeView,
  batchedErrorView,
  bitwiseSolanaStake,
  solanaStake,
  stakeFailure,
  stakesV3Response,
} from "./internals/wire.mock";

const BASE_URL = "https://earn.test";
const STAKES_URL = `${BASE_URL}/v3/stakes`;
/** The timeout of the Earn service for a request that sets none. */
const DEFAULT_TIMEOUT_MS = 10_000;

const owner = { network: "solana", address: OWNER_ADDRESS };
const { getEarnPositions } = earnPositionsApi.endpoints;

// Wired the way the apps wire it: the store registers the service api, and the endpoints only exist
// because importing this package injected them.
function makeStore(earnApiBaseUrl = BASE_URL) {
  return configureStore({
    reducer: { [earnApi.reducerPath]: earnApi.reducer },
    middleware: gdm =>
      gdm({ thunk: { extraArgument: earnApiExtra({ earnApiBaseUrl }) } }).concat(
        earnApi.middleware,
      ),
  });
}

const endpoints = { stakes: jest.fn() };
const server = setupServer(http.post(STAKES_URL, endpoints.stakes));

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

beforeEach(() => {
  endpoints.stakes.mockReset().mockImplementation(() =>
    HttpResponse.json(
      stakesV3Response([batchStakeView(solanaStake()), batchStakeView(bitwiseSolanaStake())], {
        is_stale: true,
      }),
    ),
  );
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

function stakesRequest(call = 0): Request {
  return endpoints.stakes.mock.calls[call][0].request;
}

async function waitUntil(condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 50 && !condition(); attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

describe("earnPositionsApi configuration", () => {
  it("is the Earn service api, mutated in place by enhanceEndpoints and injectEndpoints", () => {
    expect(earnPositionsApi).toBe(earnApi);
    expect(earnPositionsApi.reducerPath).toBe("earnApi");
  });

  it("exposes the positions endpoint and its hook, and nothing else", () => {
    expect(getEarnPositions).toBeDefined();
    expect(useGetEarnPositionsQuery).toBeInstanceOf(Function);
    expect(Object.keys(earnPositionsApi.endpoints)).toEqual(["getEarnPositions"]);
  });
});

describe("getEarnPositions", () => {
  it("maps two SOL rows to two positions keyed by their stake accounts, stale as the meta says", async () => {
    const result = await makeStore().dispatch(getEarnPositions.initiate(owner));

    expect(result.data?.positions.map(position => position.id)).toEqual([
      STAKE_ACCOUNT_A,
      STAKE_ACCOUNT_B,
    ]);
    expect(result.data?.positions[0]).toMatchObject({
      validatorAddress: LEDGER_BY_FIGMENT_VOTE_ACCOUNT,
      validatorName: "Ledger by Figment",
      balance: "10000000000",
      deposited: "9750000000",
      totalRewards: "250000000",
      interest: { type: "APY", value: 0.0712 },
    });
    expect(result.data?.isStale).toBe(true);
    expect(result.data?.respondedAt).toBe("2026-11-18T12:00:01Z");
  });

  it("asks POST /v3/stakes for the address, without the fresh flag", async () => {
    await makeStore().dispatch(getEarnPositions.initiate(owner));

    const request = stakesRequest();
    expect(request.method).toBe("POST");
    expect(await request.json()).toEqual([{ network: "solana", address: OWNER_ADDRESS }]);
  });

  it("sends fresh: true in a cache entry of its own", async () => {
    const store = makeStore();
    await store.dispatch(getEarnPositions.initiate(owner));
    await store.dispatch(getEarnPositions.initiate({ ...owner, fresh: true }));
    // Each read is served again from its own entry.
    await store.dispatch(getEarnPositions.initiate(owner));
    await store.dispatch(getEarnPositions.initiate({ ...owner, fresh: true }));

    expect(endpoints.stakes).toHaveBeenCalledTimes(2);
    expect(await stakesRequest(1).json()).toEqual([
      { network: "solana", address: OWNER_ADDRESS, fresh: true },
    ]);
  });

  it("reads fresh: false from the cache entry of the plain read", async () => {
    const store = makeStore();
    await store.dispatch(getEarnPositions.initiate(owner));
    const result = await store.dispatch(getEarnPositions.initiate({ ...owner, fresh: false }));

    expect(result.data?.positions).toHaveLength(2);
    expect(endpoints.stakes).toHaveBeenCalledTimes(1);
  });

  it("returns the failure rows of HTTP 200 as typed failures, not as an address with no position", async () => {
    endpoints.stakes.mockImplementation(() =>
      HttpResponse.json(stakesV3Response([batchedErrorView(), batchStakeView(stakeFailure())])),
    );

    const result = await makeStore().dispatch(getEarnPositions.initiate(owner));

    expect(result.error).toBeUndefined();
    expect(result.data).toMatchObject({
      positions: [],
      failures: [
        { code: 503, reason: "Provider unavailable" },
        { code: 502, reason: "Bad gateway from provider" },
      ],
    });
  });

  it("returns no position and no failure for an address that holds none", async () => {
    endpoints.stakes.mockImplementation(() => HttpResponse.json(stakesV3Response([])));

    const result = await makeStore().dispatch(getEarnPositions.initiate(owner));

    expect(result.data).toMatchObject({ positions: [], failures: [], isStale: false });
  });

  it("turns a malformed payload into a query error", async () => {
    endpoints.stakes.mockImplementation(() => HttpResponse.json([batchStakeView(solanaStake())]));

    const result = await makeStore().dispatch(getEarnPositions.initiate(owner));

    expect(result.data).toBeUndefined();
    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: expect.stringContaining("rawResponseSchema rejected the response"),
    });
  });

  it("turns a null data into a query error, never into an address with no position", async () => {
    endpoints.stakes.mockImplementation(() =>
      HttpResponse.json({ data: null, meta: { is_stale: false } }),
    );

    const result = await makeStore().dispatch(getEarnPositions.initiate(owner));

    expect(result.data).toBeUndefined();
    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: expect.stringContaining("data: Invalid input"),
    });
  });

  it("reads a SOL row without its stake account as a failure, and keeps the other rows", async () => {
    endpoints.stakes.mockImplementation(() =>
      HttpResponse.json(
        stakesV3Response([
          batchStakeView(solanaStake({}, { stake_account: undefined })),
          batchStakeView(bitwiseSolanaStake()),
        ]),
      ),
    );

    const result = await makeStore().dispatch(getEarnPositions.initiate(owner));

    expect(result.error).toBeUndefined();
    expect(result.data?.positions.map(position => position.id)).toEqual([STAKE_ACCOUNT_B]);
    expect(result.data?.failures).toEqual([UNREADABLE_ROW_FAILURE]);
  });

  it("fails softly, without a request, when the Earn base URL is empty", async () => {
    const result = await makeStore("").dispatch(getEarnPositions.initiate(owner));

    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: "earnApiBaseUrl is empty: the Earn service is disabled",
    });
    expect(endpoints.stakes).not.toHaveBeenCalled();
  });

  it("fetches a subscribed read again when the tag of its address is invalidated, and no other", async () => {
    const store = makeStore();
    await store.dispatch(getEarnPositions.initiate(owner));
    await store.dispatch(
      getEarnPositions.initiate({ network: "solana", address: OTHER_OWNER_ADDRESS }),
    );

    store.dispatch(
      earnPositionsApi.util.invalidateTags([{ type: EARN_POSITIONS_TAG, id: OWNER_ADDRESS }]),
    );
    await waitUntil(() => endpoints.stakes.mock.calls.length === 3);

    expect(endpoints.stakes).toHaveBeenCalledTimes(3);
    expect(await stakesRequest(2).json()).toEqual([{ network: "solana", address: OWNER_ADDRESS }]);
  });

  describe("with fake timers", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("sends the read again after a 503, then returns the positions", async () => {
      endpoints.stakes.mockImplementationOnce(() => HttpResponse.json({}, { status: 503 }));

      const pending = makeStore().dispatch(getEarnPositions.initiate(owner));
      await jest.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS);
      const result = await pending;

      expect(endpoints.stakes).toHaveBeenCalledTimes(2);
      expect(result.data?.positions).toHaveLength(2);
    });

    it("does not send the read again after a 400", async () => {
      endpoints.stakes.mockImplementation(() =>
        HttpResponse.json({ msg: "No accounts provided" }, { status: 400 }),
      );

      const pending = makeStore().dispatch(getEarnPositions.initiate(owner));
      await jest.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS);
      const result = await pending;

      expect(endpoints.stakes).toHaveBeenCalledTimes(1);
      expect(result.error).toMatchObject({ status: 400 });
    });

    it("ends a hung read with a TIMEOUT_ERROR after 10 s, and does not send it again", async () => {
      endpoints.stakes.mockImplementation(() => new Promise(() => {}));

      const pending = makeStore().dispatch(getEarnPositions.initiate(owner));
      await jest.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS);
      const result = await pending;

      expect(result.error).toEqual({ status: "TIMEOUT_ERROR", error: "Timed out after 10000 ms" });
      expect(endpoints.stakes).toHaveBeenCalledTimes(1);
    });

    it("gives a fresh read 20 s before it times out", async () => {
      endpoints.stakes.mockImplementation(() => new Promise(() => {}));
      let settled = false;

      const pending = makeStore().dispatch(getEarnPositions.initiate({ ...owner, fresh: true }));
      void pending.then(() => {
        settled = true;
      });
      await jest.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS);
      expect(settled).toBe(false);

      await jest.advanceTimersByTimeAsync(10_000);
      const result = await pending;

      expect(result.error).toEqual({ status: "TIMEOUT_ERROR", error: "Timed out after 20000 ms" });
      expect(endpoints.stakes).toHaveBeenCalledTimes(1);
    });

    it("clears the timer of a read that settles", async () => {
      await makeStore().dispatch(getEarnPositions.initiate({ ...owner, fresh: true }));
      await jest.advanceTimersByTimeAsync(20_000);

      expect(stakesRequest().signal.aborted).toBe(false);
    });
  });
});
