import { act, renderHook, waitFor } from "@testing-library/react";
import { useCurrenciesByIds } from "./useCurrenciesByIds";

const dispatch = jest.fn();

jest.mock("react-redux", () => ({ useDispatch: () => dispatch }));

jest.mock("@domain/api-currency-token", () => ({
  cryptoAssetsApi: {
    endpoints: {
      findTokenById: { initiate: ({ id }: { id: string }) => ({ type: "initiate", id }) },
    },
  },
}));

const USDC_ID = "ethereum/erc20/usd__coin";
const USDT_ID = "ethereum/erc20/usd_tether__erc20_";

type Request = Promise<{ data?: { id: string } }> & { unsubscribe: jest.Mock };

/** Stands in for `dispatch(initiate(...))`: a promise that also carries `unsubscribe`. */
function request(data: { id: string } | undefined): Request {
  const promise = Promise.resolve({ data }) as Request;
  promise.unsubscribe = jest.fn();
  return promise;
}

/** A request that never settles, so "still pending" needs no timer to hold the worker open. */
function pendingRequest(): Request {
  const promise = new Promise<{ data?: { id: string } }>(() => {}) as Request;
  promise.unsubscribe = jest.fn();
  return promise;
}

function answerWith(tokens: Record<string, { id: string } | undefined>) {
  dispatch.mockImplementation((action: { id: string }) => request(tokens[action.id]));
}

describe("useCurrenciesByIds", () => {
  beforeEach(() => {
    dispatch.mockReset();
    answerWith({ [USDC_ID]: { id: USDC_ID }, [USDT_ID]: { id: USDT_ID } });
  });

  it("answers coins from the registry without dispatching", () => {
    const { result } = renderHook(() => useCurrenciesByIds(["bitcoin", "ethereum"]));

    expect(result.current.get("bitcoin")?.ticker).toBe("BTC");
    expect(result.current.get("ethereum")?.ticker).toBe("ETH");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("dispatches one lookup per token id, however many there are", async () => {
    const { result } = renderHook(() => useCurrenciesByIds([USDC_ID, USDT_ID, "bitcoin"]));

    await waitFor(() => expect(result.current.size).toBe(3));
    expect(dispatch.mock.calls.map(([action]) => action.id).sort()).toEqual(
      [USDC_ID, USDT_ID].sort(),
    );
  });

  it("dispatches once for a duplicated id", async () => {
    const { result } = renderHook(() => useCurrenciesByIds([USDC_ID, USDC_ID]));

    await waitFor(() => expect(result.current.has(USDC_ID)).toBe(true));
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it("dispatches nothing for an empty list", () => {
    const { result } = renderHook(() => useCurrenciesByIds([]));

    expect(result.current.size).toBe(0);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("drops a token resolved for a previous list, so it answers only what was asked", async () => {
    const { result, rerender } = renderHook(({ ids }) => useCurrenciesByIds(ids), {
      initialProps: { ids: [USDC_ID] as string[] },
    });

    await waitFor(() => expect(result.current.has(USDC_ID)).toBe(true));

    // A list with no token ids at all: the effect has nothing to fetch, so it must not leave the
    // previous token behind in the map.
    act(() => rerender({ ids: ["bitcoin"] }));
    expect(result.current.has(USDC_ID)).toBe(false);
    expect(result.current.has("bitcoin")).toBe(true);
  });

  it("answers with the tokens that resolved, even when another is still pending", async () => {
    dispatch.mockImplementation((action: { id: string }) =>
      action.id === USDC_ID ? request({ id: USDC_ID }) : pendingRequest(),
    );

    const { result } = renderHook(() => useCurrenciesByIds([USDC_ID, USDT_ID]));

    // Waiting for both would withhold USDC for as long as USDT takes — here, forever.
    await waitFor(() => expect(result.current.has(USDC_ID)).toBe(true));
  });

  it("unsubscribes every request on unmount", async () => {
    const requests: Request[] = [];
    dispatch.mockImplementation((action: { id: string }) => {
      const r = request({ id: action.id });
      requests.push(r);
      return r;
    });

    const { unmount } = renderHook(() => useCurrenciesByIds([USDC_ID, USDT_ID]));
    await waitFor(() => expect(requests).toHaveLength(2));
    unmount();

    for (const r of requests) expect(r.unsubscribe).toHaveBeenCalled();
  });
});
