import { renderHook, waitFor } from "tests/testSetup";
import {
  DISCOVER_STORE_KEY,
  INITIAL_PLATFORM_STATE,
} from "@ledgerhq/live-common/wallet-api/constants";
import { DiscoverDB } from "@ledgerhq/live-common/wallet-api/types";
import { db } from "~/renderer/bridge";
import { useCurrentAccountHistDB, useRecentlyUsedDB } from "./hooks";

const storedDiscover: DiscoverDB = {
  recentlyUsed: [{ id: "app-1", usedAt: "2026-11-17T10:00:00.000Z" }],
  localLiveApp: [],
  currentAccountHist: { "app-1": "account-1" },
  cacheBustedLiveApps: { init: 1 },
};

describe("discover hooks", () => {
  beforeEach(() => {
    jest.mocked(db.getKey).mockResolvedValue(storedDiscover);
  });

  it("reads the recently used apps from the discover record", async () => {
    const { result } = renderHook(() => useRecentlyUsedDB());

    await waitFor(() => expect(result.current[0]).toEqual(storedDiscover.recentlyUsed));
    expect(db.getKey).toHaveBeenCalledWith("app", DISCOVER_STORE_KEY, INITIAL_PLATFORM_STATE);
  });

  it("reads the current account history from the discover record", async () => {
    const { result } = renderHook(() => useCurrentAccountHistDB());

    await waitFor(() => expect(result.current[0]).toEqual(storedDiscover.currentAccountHist));
  });
});
