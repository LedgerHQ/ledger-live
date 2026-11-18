import { renderHook, waitFor } from "@tests/test-renderer";
import storage from "LLM/storage";
import { DISCOVER_STORE_KEY } from "@ledgerhq/live-common/wallet-api/constants";
import { DiscoverDB } from "@ledgerhq/live-common/wallet-api/types";
import { useCacheBustedLiveAppsDB, useCurrentAccountHistDB, useRecentlyUsedDB } from "./hooks";

const storedDiscover: DiscoverDB = {
  recentlyUsed: [{ id: "app-1", usedAt: "2026-11-17T10:00:00.000Z" }],
  localLiveApp: [],
  currentAccountHist: { "app-1": "account-1" },
  cacheBustedLiveApps: { "app-1": 2 },
};

describe("discover hooks", () => {
  beforeEach(async () => {
    await storage.save(DISCOVER_STORE_KEY, storedDiscover);
  });

  afterEach(async () => {
    await storage.delete(DISCOVER_STORE_KEY);
  });

  it("reads the recently used apps from the discover record", async () => {
    const { result } = renderHook(() => useRecentlyUsedDB());

    await waitFor(() => expect(result.current[0]).toEqual(storedDiscover.recentlyUsed));
  });

  it("reads the current account history from the discover record", async () => {
    const { result } = renderHook(() => useCurrentAccountHistDB());

    await waitFor(() => expect(result.current[0]).toEqual(storedDiscover.currentAccountHist));
  });

  it("reads the cache-busted live apps from the discover record", async () => {
    const { result } = renderHook(() => useCacheBustedLiveAppsDB());

    await waitFor(() => expect(result.current[0]).toEqual(storedDiscover.cacheBustedLiveApps));
  });
});
