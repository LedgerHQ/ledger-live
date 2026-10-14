import { renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { useQuickActionsCtasViewModel } from "../useQuickActionsCtasViewModel";
import { QUICK_ACTIONS_TEST_IDS } from "../../../testIds";

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

const withReadOnly =
  (readOnlyModeEnabled: boolean) =>
  (state: State): State => ({
    ...state,
    settings: { ...state.settings, readOnlyModeEnabled },
  });

describe("useQuickActionsCtasViewModel", () => {
  it("returns the no_signer CTAs (connect + buy_ledger) when readOnlyModeEnabled", () => {
    const { result } = renderHook(() => useQuickActionsCtasViewModel(), {
      overrideInitialState: withReadOnly(true),
    });

    const ids = result.current.quickActions.map(a => a.id);
    expect(ids).toEqual(["connect", "buy_ledger"]);
  });

  it("returns the standard CTAs (transfer + swap + buy) when not in read-only mode", () => {
    const { result } = renderHook(() => useQuickActionsCtasViewModel(), {
      overrideInitialState: withReadOnly(false),
    });

    const ids = result.current.quickActions.map(a => a.id);
    expect(ids).toEqual(["transfer", "swap", "buy"]);
  });

  it("exposes testIDs that match QUICK_ACTIONS_TEST_IDS for the standard CTAs", () => {
    const { result } = renderHook(() => useQuickActionsCtasViewModel(), {
      overrideInitialState: withReadOnly(false),
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
        overrideInitialState: withReadOnly(false),
      },
    );

    expect(result.current.quickActions.length).toBeGreaterThan(0);
  });
});
