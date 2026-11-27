/**
 * @jest-environment jsdom
 */

import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ComponentProps, type ReactNode } from "react";
import { Provider } from "react-redux";
import { earnApi, earnApiExtra } from "@shared/api-services";
import { EARN_POSITIONS_TAG, earnPositionsApi } from "./api";
import { useRefreshEarnPositions } from "./useRefreshEarnPositions";

const OWNER_ADDRESS = "Wa11etTestAddress1111111111111111111111111111";
const OTHER_OWNER_ADDRESS = "Wa11etTestAddress2222222222222222222222222222";

// jsdom has no fetch: this read answers without the network and provides the tag that
// `getEarnPositions` provides. That `getEarnPositions` fetches again on it is in api.test.ts.
const readPositions = jest.fn((address: string) => ({ data: address }));
const probeApi = earnPositionsApi.injectEndpoints({
  endpoints: build => ({
    probePositions: build.query<string, string>({
      queryFn: address => readPositions(address),
      providesTags: (_result, _error, address) => [{ type: EARN_POSITIONS_TAG, id: address }],
    }),
  }),
  overrideExisting: true,
});

function setup() {
  const store = configureStore({
    reducer: { [earnApi.reducerPath]: earnApi.reducer },
    middleware: gdm =>
      gdm({
        thunk: { extraArgument: earnApiExtra({ earnApiBaseUrl: "https://earn.test" }) },
      }).concat(earnApi.middleware),
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(Provider, { store } as ComponentProps<typeof Provider>, children);
  return { store, wrapper };
}

beforeEach(() => {
  readPositions.mockClear();
});

describe("useRefreshEarnPositions", () => {
  it("fetches again a read subscribed to the positions of the address, and no other", async () => {
    const { store, wrapper } = setup();
    await store.dispatch(probeApi.endpoints.probePositions.initiate(OWNER_ADDRESS));
    await store.dispatch(probeApi.endpoints.probePositions.initiate(OTHER_OWNER_ADDRESS));
    const { result } = renderHook(() => useRefreshEarnPositions(), { wrapper });

    act(() => {
      result.current(OWNER_ADDRESS);
    });

    await waitFor(() => expect(readPositions).toHaveBeenCalledTimes(3));
    expect(readPositions.mock.calls.map(([address]) => address)).toEqual([
      OWNER_ADDRESS,
      OTHER_OWNER_ADDRESS,
      OWNER_ADDRESS,
    ]);
  });

  it("returns the same function on every render", () => {
    const { wrapper } = setup();
    const { result, rerender } = renderHook(() => useRefreshEarnPositions(), { wrapper });
    const refresh = result.current;

    rerender();

    expect(result.current).toBe(refresh);
  });
});
