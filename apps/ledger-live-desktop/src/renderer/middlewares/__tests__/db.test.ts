import type { Dispatch, MiddlewareAPI, UnknownAction } from "@reduxjs/toolkit";
import { setKey } from "~/renderer/storage";
import type { State } from "../../reducers";
import DBMiddleware from "../db";

jest.mock("~/renderer/storage", () => ({
  setKey: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/postOnboarding/reducer", () => ({
  postOnboardingSelector: jest.fn(() => ({})),
}));

jest.mock("@ledgerhq/live-common/postOnboarding/actions", () => ({
  actionTypePrefix: "POST_ONBOARDING_",
}));

jest.mock("../../reducers/settings", () => ({
  settingsStoreSelector: (state: FakeState) => state.settings,
  areSettingsLoaded: (state: FakeState) => state.settings.loaded === true,
}));

jest.mock("@ledgerhq/live-wallet/store", () => ({
  accountUserDataExportSelector: jest.fn(() => null),
  walletStateExportShouldDiffer: jest.fn(() => false),
  exportWalletState: jest.fn(s => s),
}));

jest.mock("@ledgerhq/ledger-key-ring-protocol/store", () => ({
  trustchainStoreActionTypePrefix: "TRUSTCHAIN_STORE_",
  trustchainStoreSelector: jest.fn(state => state.trustchain),
}));

jest.mock("@ledgerhq/cryptoassets/cal-client/persistence", () => ({
  extractPersistedCALFromState: jest.fn(() => ({ tokens: [] })),
  persistedCALContentEqual: jest.fn(() => true),
}));

jest.mock("../../reducers/market", () => ({
  marketStoreSelector: (state: FakeState) => state.market,
}));

jest.mock("@ledgerhq/client-ids/store", () => ({
  exportIdentitiesForPersistence: jest.fn(s => s),
}));

jest.mock("@ledgerhq/live-common/account/index", () => ({
  accountsPersistedStateChanged: jest.fn(() => false),
}));

const mockedSetKey = jest.mocked(setKey);

type FakeState = {
  settings: { loaded: boolean; starredMarketCoins: string[] };
  market: Record<string, unknown>;
  application: { isLocked: boolean };
  wallet: unknown;
  accounts: unknown[];
  identities: unknown;
  history: unknown;
  featureFlags: { overrides: unknown; bannerVisible: unknown; remoteFlagsReady?: unknown };
  coinConfigOverrides: { overrides: Record<string, unknown> };
  trustchain?: unknown;
};

const baseState = (): FakeState => ({
  settings: { loaded: true, starredMarketCoins: [] },
  market: { currentPage: 1 },
  application: { isLocked: false },
  wallet: {},
  accounts: [],
  identities: {},
  history: {},
  featureFlags: { overrides: {}, bannerVisible: false },
  coinConfigOverrides: { overrides: {} },
});

function runMiddleware(states: FakeState[], action: { type: string; payload?: unknown }) {
  let callCount = 0;
  const store = {
    getState: () => states[Math.min(callCount, states.length - 1)] as unknown as State,
    dispatch: jest.fn(),
  } as MiddlewareAPI<Dispatch<UnknownAction>, State>;
  const next = jest.fn(() => {
    callCount += 1;
    return action;
  });

  return DBMiddleware(store)(next)(action);
}

describe("DBMiddleware - MARKET branch", () => {
  beforeEach(() => {
    mockedSetKey.mockReset();
  });

  it("persists settings when a MARKET_* action mutates the settings slice (e.g. MARKET_ADD_STARRED_COINS)", () => {
    const before = baseState();
    const after: FakeState = {
      ...before,
      settings: { ...before.settings, starredMarketCoins: ["bitcoin"] },
    };

    runMiddleware([before, after], { type: "MARKET_ADD_STARRED_COINS", payload: "bitcoin" });

    expect(mockedSetKey).toHaveBeenCalledTimes(1);
    expect(mockedSetKey).toHaveBeenCalledWith("app", "settings", after.settings);
    expect(mockedSetKey).not.toHaveBeenCalledWith("app", "market", expect.anything());
  });

  it("persists market (only) when a MARKET_* action mutates the market slice", () => {
    const before = baseState();
    const after: FakeState = {
      ...before,
      market: { currentPage: 2 },
    };

    runMiddleware([before, after], { type: "MARKET_SET_CURRENT_PAGE", payload: 2 });

    expect(mockedSetKey).toHaveBeenCalledTimes(1);
    expect(mockedSetKey).toHaveBeenCalledWith("app", "market", after.market);
    expect(mockedSetKey).not.toHaveBeenCalledWith("app", "settings", expect.anything());
  });

  it("persists both market and settings if both slices change on a MARKET_* action", () => {
    const before = baseState();
    const after: FakeState = {
      ...before,
      market: { currentPage: 2 },
      settings: { ...before.settings, starredMarketCoins: ["bitcoin"] },
    };

    runMiddleware([before, after], { type: "MARKET_ADD_STARRED_COINS", payload: "bitcoin" });

    expect(mockedSetKey).toHaveBeenCalledTimes(2);
    expect(mockedSetKey).toHaveBeenNthCalledWith(1, "app", "market", after.market);
    expect(mockedSetKey).toHaveBeenNthCalledWith(2, "app", "settings", after.settings);
  });

  it("does not persist anything when neither slice changed", () => {
    const state = baseState();
    runMiddleware([state, state], { type: "MARKET_NOOP" });

    expect(mockedSetKey).not.toHaveBeenCalled();
  });

  it("does not persist settings on a MARKET_* action when settings are not loaded yet", () => {
    const before = baseState();
    const after: FakeState = {
      ...before,
      settings: { loaded: false, starredMarketCoins: ["bitcoin"] },
    };

    runMiddleware([before, after], { type: "MARKET_ADD_STARRED_COINS", payload: "bitcoin" });

    expect(mockedSetKey).toHaveBeenCalledTimes(0);
    expect(mockedSetKey).not.toHaveBeenCalledWith("app", "settings", expect.anything());
  });
});

describe("DBMiddleware - featureFlags branch", () => {
  beforeEach(() => {
    mockedSetKey.mockReset();
  });

  it("persists only { overrides, bannerVisible } — never the transient remoteFlagsReady gate", () => {
    const before = baseState();
    const after: FakeState = {
      ...before,
      featureFlags: {
        overrides: { mockFeature: { enabled: true } },
        bannerVisible: false,
        remoteFlagsReady: true,
      },
    };

    runMiddleware([before, after], { type: "FEATURE_FLAGS_SET_OVERRIDE" });

    expect(mockedSetKey).toHaveBeenCalledTimes(1);
    expect(mockedSetKey).toHaveBeenCalledWith("app", "featureFlags", {
      overrides: after.featureFlags.overrides,
      bannerVisible: false,
    });

    const persisted = mockedSetKey.mock.calls[0][2] as Record<string, unknown>;
    expect(persisted).not.toHaveProperty("remoteFlagsReady");
  });
});

describe("DBMiddleware - coinConfigOverrides branch", () => {
  beforeEach(() => {
    mockedSetKey.mockReset();
  });

  it("persists coinConfigOverrides under app/coinConfigOverrides when the slice reference changes", () => {
    const before = baseState();
    const newOverrides = { config_currency_solana: { token2022Enabled: true } };
    const after: FakeState = {
      ...before,
      coinConfigOverrides: { overrides: newOverrides },
    };

    runMiddleware([before, after], { type: "coinConfigOverrides/setCoinConfigOverride" });

    expect(mockedSetKey).toHaveBeenCalledWith("app", "coinConfigOverrides", {
      overrides: newOverrides,
    });
  });

  it("does not persist when the coinConfigOverrides reference is unchanged", () => {
    const state = baseState();
    runMiddleware([state, state], { type: "coinConfigOverrides/setCoinConfigOverride" });

    expect(mockedSetKey).not.toHaveBeenCalledWith("app", "coinConfigOverrides", expect.anything());
  });

  it("persists an empty overrides map (e.g. after Restore all)", () => {
    const before: FakeState = {
      ...baseState(),
      coinConfigOverrides: {
        overrides: { config_currency_solana: { token2022Enabled: true } },
      },
    };
    const after: FakeState = {
      ...before,
      coinConfigOverrides: { overrides: {} },
    };

    runMiddleware([before, after], {
      type: "coinConfigOverrides/setAllCoinConfigOverrides",
    });

    expect(mockedSetKey).toHaveBeenCalledWith("app", "coinConfigOverrides", { overrides: {} });
  });
});
