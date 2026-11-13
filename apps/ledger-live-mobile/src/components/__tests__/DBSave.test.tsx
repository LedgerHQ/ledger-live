import { cryptoAssetsApi } from "@domain/api-currency-token";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { calApi } from "@shared/api-services";
import { dismissAccountAnalyticsIntroduction } from "@features/flow-account-detail-analytics-notice/state";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import storage from "LLM/storage";
import { ConfigureDBSaveEffects, flushAll } from "../DBSave";

describe("ConfigureDBSaveEffects", () => {
  beforeEach(async () => {
    await storage.delete("cryptoAssetsCache");
  });

  it("saves a CAL cache that the hash check updated before the effects mounted", async () => {
    const checkedCache = cryptoAssetsApi.util.upsertQueryEntries([
      { endpointName: "findTokenById", arg: { id: usdcToken.id }, value: usdcToken },
      { endpointName: "getTokensSyncHash", arg: "ethereum", value: "new-hash" },
    ]);

    renderHook(() => ConfigureDBSaveEffects(), {
      overrideInitialState: state => ({
        ...state,
        [calApi.reducerPath]: calApi.reducer(state[calApi.reducerPath], checkedCache),
      }),
    });

    await waitFor(async () =>
      expect(await storage.get("cryptoAssetsCache")).toMatchObject({
        tokens: [{ data: usdcToken }],
        hashes: { ethereum: "new-hash" },
      }),
    );
  });

  it("keeps the stored Analytics introduction state when the effects mount after a failed read", async () => {
    const stored = { hasDismissed: true, isEligible: true };
    await storage.save("accountAnalyticsIntroduction", stored);

    renderHook(() => ConfigureDBSaveEffects());
    await act(flushAll);

    expect(await storage.get("accountAnalyticsIntroduction")).toEqual(stored);
  });

  it("persists the Analytics introduction dismissal so it survives a restart", async () => {
    await storage.delete("accountAnalyticsIntroduction");
    const { store } = renderHook(() => ConfigureDBSaveEffects());

    act(() => {
      store.dispatch(dismissAccountAnalyticsIntroduction());
    });

    await waitFor(async () =>
      expect(await storage.get("accountAnalyticsIntroduction")).toEqual({
        hasDismissed: true,
        isEligible: null,
      }),
    );
  });
});
