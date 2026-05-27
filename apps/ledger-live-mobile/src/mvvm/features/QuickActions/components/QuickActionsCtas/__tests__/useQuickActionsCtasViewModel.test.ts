import { renderHook } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { setSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import type { Account } from "@ledgerhq/types-live";
import type { State } from "~/reducers/types";
import { useQuickActionsCtasViewModel } from "../useQuickActionsCtasViewModel";
import { QUICK_ACTIONS_TEST_IDS } from "../../../testIds";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => {
  const {
    defaultIsAccountEmpty,
  } = jest.requireActual("@ledgerhq/live-common/bridge/defaultBridgeExtensions");
  return {
    useAccountBridge: jest.fn(),
    useAccountBridgeOrNull: jest.fn(),
    useAccountBridgeMany: jest.fn((accounts: Account[]) =>
      accounts.map(() => ({ isAccountEmpty: defaultIsAccountEmpty })),
    ),
  };
});

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: jest.fn() }),
  useRoute: () => ({ name: "Portfolio", key: "portfolio-key", params: {} }),
}));

jest.mock("../../../hooks/useTransferDrawerController", () => ({
  useTransferDrawerController: () => ({
    openDrawer: jest.fn(),
    closeDrawer: jest.fn(),
    isOpen: false,
    sourceScreenName: "Portfolio",
  }),
}));

jest.mock("LLM/features/Reborn/hooks/useBuyDeviceAction", () => ({
  __esModule: true,
  default: () => jest.fn(),
}));

jest.mock("LLM/features/Swap", () => ({
  useOpenSwap: () => ({ handleOpenSwap: jest.fn() }),
}));

jest.mock("LLM/features/Receive", () => ({
  useOpenReceiveDrawer: () => ({ handleOpenReceiveDrawer: jest.fn() }),
}));

setSupportedCurrencies(["bitcoin"]);

const bitcoin = getCryptoCurrencyById("bitcoin");
const BTC_FUNDED = genAccount("qa-ctas-btc-funded", {
  currency: bitcoin,
  operationsSize: 3,
});
const BTC_EMPTY = genAccount("qa-ctas-btc-empty", {
  currency: bitcoin,
  operationsSize: 0,
});

const withReadOnly = (state: State): State => ({
  ...state,
  settings: { ...state.settings, readOnlyModeEnabled: true },
});

const withFundedAccount = (state: State): State => ({
  ...state,
  accounts: { active: [BTC_FUNDED] },
  settings: { ...state.settings, readOnlyModeEnabled: false },
});

const withEmptyAccount = (state: State): State => ({
  ...state,
  accounts: { active: [BTC_EMPTY] },
  settings: { ...state.settings, readOnlyModeEnabled: false },
});

describe("useQuickActionsCtasViewModel", () => {
  it("returns the no_signer CTAs (connect + buy_ledger) when readOnlyModeEnabled", () => {
    const { result } = renderHook(() => useQuickActionsCtasViewModel(), {
      overrideInitialState: withReadOnly,
    });

    const ids = result.current.quickActions.map(a => a.id);
    expect(ids).toEqual(["connect", "buy_ledger"]);
    expect(result.current.isVariant).toBe(false);
  });

  it("returns the standard CTAs (transfer + swap + buy) when accounts have funds", () => {
    const { result } = renderHook(() => useQuickActionsCtasViewModel(), {
      overrideInitialState: withFundedAccount,
    });

    const ids = result.current.quickActions.map(a => a.id);
    expect(ids).toEqual(["transfer", "swap", "buy"]);
  });

  it("returns the standard CTAs even when accounts are empty (userState=no_funds)", () => {
    const { result } = renderHook(() => useQuickActionsCtasViewModel(), {
      overrideInitialState: withEmptyAccount,
    });

    const ids = result.current.quickActions.map(a => a.id);
    expect(ids).toEqual(["transfer", "swap", "buy"]);
  });

  it("exposes testIDs that match QUICK_ACTIONS_TEST_IDS for the standard CTAs", () => {
    const { result } = renderHook(() => useQuickActionsCtasViewModel(), {
      overrideInitialState: withFundedAccount,
    });

    const testIds = result.current.quickActions.map(a => a.testID);
    expect(testIds).toEqual([
      QUICK_ACTIONS_TEST_IDS.ctas.transfer,
      QUICK_ACTIONS_TEST_IDS.ctas.swap,
      QUICK_ACTIONS_TEST_IDS.ctas.buy,
    ]);
  });

  it("forwards sourceScreenName override to the page tracking name", () => {
    const { result } = renderHook(
      () => useQuickActionsCtasViewModel({ sourceScreenName: "AssetDetail" }),
      {
        overrideInitialState: withFundedAccount,
      },
    );

    expect(result.current.quickActions.length).toBeGreaterThan(0);
  });
});
