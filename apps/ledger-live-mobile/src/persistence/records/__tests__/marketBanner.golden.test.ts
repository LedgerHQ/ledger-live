import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  createPersistence,
  persistenceSlice,
  selectRecordStatus,
} from "@features/platform-persistence";
import { createMemoryStorage } from "@shared/storage";
import {
  importMarketBannerState,
  marketBannerReducer,
  setMarketBannerRanking,
} from "~/reducers/marketBanner";
import type { MarketBannerRanking, MarketBannerState } from "~/reducers/types";
import { marketBannerRecord } from "../marketBanner";
import storedFavorites from "./__fixtures__/marketBanner.favorites.json";

const rootReducer = combineReducers({
  marketBanner: marketBannerReducer,
  persistence: persistenceSlice.reducer,
});
type TestState = ReturnType<typeof rootReducer>;
const bindings = [{ record: marketBannerRecord }];

/** A frozen copy of the legacy save: `saveMarketBannerState(marketBannerStoreSelector(state))`. */
const legacyStoredJson = (state: { marketBanner: MarketBannerState }) =>
  JSON.stringify(state.marketBanner);

const flushWrites = async () => {
  for (let tick = 0; tick < 10; tick++) await Promise.resolve();
};

function setup(stored: Record<string, unknown>) {
  const storage = createMemoryStorage(stored);
  const report = jest.fn();
  const persistence = createPersistence<TestState>({ storage, bindings, report });
  const store = configureStore({
    reducer: rootReducer,
    middleware: getDefault => getDefault().concat(persistence.middleware),
  });
  const hydrate = () => persistence.hydrate(store);
  return { storage, store, report, hydrate };
}

describe("marketBanner stored by the legacy code", () => {
  it("hydrates to the same state as the legacy import", async () => {
    const { store, hydrate, report } = setup({ marketBanner: storedFavorites });
    await hydrate();

    expect(store.getState().marketBanner).toEqual(
      marketBannerReducer(undefined, importMarketBannerState(storedFavorites as MarketBannerState)),
    );
    expect(selectRecordStatus(store.getState(), "marketBanner")).toBe("loaded");
    expect(report).not.toHaveBeenCalled();
  });

  it("encodes the stored fixture to the same JSON", () => {
    const state = { marketBanner: storedFavorites as MarketBannerState };
    expect(
      JSON.stringify(marketBannerRecord.codec.encode(marketBannerRecord.state.select(state))),
    ).toBe(JSON.stringify(storedFavorites));
  });

  it.each<MarketBannerRanking>(["trending", "gainers", "losers", "favorites"])(
    "encodes the %s ranking to the legacy stored JSON",
    ranking => {
      const state = {
        marketBanner: marketBannerReducer(undefined, setMarketBannerRanking(ranking)),
      };
      expect(
        JSON.stringify(marketBannerRecord.codec.encode(marketBannerRecord.state.select(state))),
      ).toBe(legacyStoredJson(state));
    },
  );
});

describe("marketBanner write", () => {
  it("writes the legacy shape when the ranking changes", async () => {
    const { store, storage, hydrate } = setup({ marketBanner: storedFavorites });
    await hydrate();

    store.dispatch(setMarketBannerRanking("losers"));
    await flushWrites();

    await expect(storage.get("marketBanner")).resolves.toEqual({ ranking: "losers" });
  });

  it("keeps the default and writes nothing when nothing is stored", async () => {
    const { store, storage, hydrate } = setup({});
    await hydrate();
    await flushWrites();

    expect(selectRecordStatus(store.getState(), "marketBanner")).toBe("empty");
    expect(store.getState().marketBanner).toEqual({ ranking: "trending" });
    await expect(storage.get("marketBanner")).resolves.toBeUndefined();
  });
});

describe("marketBanner stored with a ranking that this app does not know", () => {
  it("fails the record and never writes over the newer value", async () => {
    const newer = { ranking: "volume" };
    const { store, storage, hydrate, report } = setup({ marketBanner: newer });
    await hydrate();

    store.dispatch(setMarketBannerRanking("losers"));
    await flushWrites();

    expect(selectRecordStatus(store.getState(), "marketBanner")).toBe("failed");
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ key: "marketBanner", operation: "decode" }),
    );
    await expect(storage.get("marketBanner")).resolves.toEqual(newer);
  });
});
