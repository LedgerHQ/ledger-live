import { configureStore } from "@reduxjs/toolkit";
import { renderHook, waitFor } from "@tests/test-renderer";
import { cryptoAssetsApi } from "@domain/api-currency-token";
import { calApi } from "@shared/api-services";
import { saveCryptoAssetsCacheState } from "~/db";
import { ConfigureDBSaveEffects } from "../DBSave";

jest.mock("~/db", () => {
  const actual = jest.requireActual("~/db");
  const mocked: Record<string, unknown> = { ...actual };
  for (const [name, value] of Object.entries(actual)) {
    if (name.startsWith("save") && typeof value === "function") mocked[name] = jest.fn();
  }
  return mocked;
});

/** A CAL slice whose hash check already evicted the stale tokens. */
function evictedCalSlice() {
  const store = configureStore({
    reducer: { [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(cryptoAssetsApi.middleware),
  });
  store.dispatch(
    cryptoAssetsApi.util.upsertQueryEntries([
      { endpointName: "getTokensSyncHash", arg: "ethereum", value: "hash456" },
    ]),
  );
  return store.getState()[calApi.reducerPath];
}

describe("ConfigureDBSaveEffects - crypto assets cache", () => {
  it("saves a cache the hash check emptied before the saver mounted", async () => {
    const calSlice = evictedCalSlice();

    renderHook(ConfigureDBSaveEffects, {
      overrideInitialState: state => ({ ...state, [calApi.reducerPath]: calSlice }),
    });

    await waitFor(() =>
      expect(saveCryptoAssetsCacheState).toHaveBeenCalledWith(
        { version: 2, tokens: [], hashes: { ethereum: "hash456" } },
        expect.anything(),
      ),
    );
  });
});
