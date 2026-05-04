import { Clock, Eye, Experiment, Refresh, Settings, Tools } from "@ledgerhq/lumen-ui-react/symbols";
import { createElement } from "react";
import { MemoryRouter } from "react-router";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import useTopBarViewModel from "../useTopBarViewModel";
import { useActivityIndicator } from "../useActivityIndicator";
import { useDiscreetMode } from "../useDiscreetMode";
import { useExperimentalFeatures } from "../useExperimentalFeatures";
import { useFeatureFlags } from "../useFeatureFlags";
import { useSettings } from "../useSettings";
import { useHistory } from "../useHistory";
import type { TopBarSlot } from "../../types";

jest.mock("../useActivityIndicator");
jest.mock("../useDiscreetMode");
jest.mock("../useExperimentalFeatures");
jest.mock("../useFeatureFlags");
jest.mock("../useSettings");
jest.mock("../useHistory");

const defaults = {
  discreetMode: { handleDiscreet: jest.fn(), discreetIcon: Eye, tooltip: "Discreet" },
  activityIndicator: {
    hasAccounts: true,
    handleSync: jest.fn(),
    isRotating: false,
    isError: false,
    tooltip: "Refresh",
    icon: Refresh,
    onTooltipShow: undefined,
  },
  settings: { handleSettings: jest.fn(), settingsIcon: Settings, tooltip: "Settings" },
  experimental: {
    isVisible: false,
    handleExperimental: jest.fn(),
    icon: Experiment,
    tooltip: "Experimental",
  },
  featureFlags: {
    isVisible: false,
    handleFeatureFlags: jest.fn(),
    icon: Tools,
    tooltip: "Feature flags",
  },
  history: { handleHistory: jest.fn(), historyIcon: Clock, tooltip: "History", cta: "History" },
};

type SetupOptions = {
  hasAccounts?: boolean;
  isRotating?: boolean;
  experimentalVisible?: boolean;
  featureFlagsVisible?: boolean;
  operationsList?: boolean;
  myWallet?: boolean;
  route?: string;
};

const setup = ({
  hasAccounts = true,
  isRotating = false,
  experimentalVisible = false,
  featureFlagsVisible = false,
  operationsList = false,
  myWallet = false,
  route,
}: SetupOptions = {}) => {
  jest.mocked(useDiscreetMode).mockReturnValue(defaults.discreetMode);
  jest.mocked(useActivityIndicator).mockReturnValue({
    ...defaults.activityIndicator,
    hasAccounts,
    isRotating,
  });
  jest.mocked(useSettings).mockReturnValue(defaults.settings);
  jest.mocked(useExperimentalFeatures).mockReturnValue({
    ...defaults.experimental,
    isVisible: experimentalVisible,
  });
  jest.mocked(useFeatureFlags).mockReturnValue({
    ...defaults.featureFlags,
    isVisible: featureFlagsVisible,
  });
  jest.mocked(useHistory).mockReturnValue(defaults.history);

  const needsFlags = operationsList || myWallet;
  const initialState = needsFlags
    ? withFlagOverrides({
        lwdWallet40: {
          enabled: true,
          params: {
            ...(operationsList && { operationsList: true }),
            ...(myWallet && { myWallet: true }),
          },
        },
      })
    : undefined;

  const routeWrapper = route
    ? ({ children }: { children: React.ReactNode }) =>
        createElement(MemoryRouter, { initialEntries: [route] }, children)
    : undefined;

  return renderHook(() => useTopBarViewModel(), {
    initialState,
    ...(routeWrapper ? { wrapper: routeWrapper, skipRouter: true } : {}),
  });
};

const getSlotLabels = (slots: TopBarSlot[]) =>
  slots.map(s => (s.type === "action" ? s.action.label : s.type));

const findSlot = (slots: TopBarSlot[], label: string) =>
  slots.find((s): s is Extract<TopBarSlot, { type: "action" }> => {
    return s.type === "action" && s.action.label === label;
  });

describe("useTopBarViewModel", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("slot ordering", () => {
    it.each<[string, SetupOptions, string[]]>([
      [
        "default (with accounts)",
        {},
        ["synchronize", "notification", "discreet", "settings", "my ledger"],
      ],
      [
        "without accounts",
        { hasAccounts: false },
        ["notification", "discreet", "settings", "my ledger"],
      ],
      [
        "all optional slots visible",
        { experimentalVisible: true, featureFlagsVisible: true, operationsList: true },
        ["experimental", "feature flags", "synchronize", "discreet", "history"],
      ],
      [
        "myWallet enabled hides settings, my ledger, and notification",
        { myWallet: true },
        ["synchronize", "discreet", "history"],
      ],
    ])("%s", (_name, options, expectedLabels) => {
      const { result } = setup(options);
      expect(getSlotLabels(result.current.topBarSlots)).toEqual(expectedLabels);
    });
  });

  describe("slot properties", () => {
    it("experimental and feature flags slots have accent appearance", () => {
      const { result } = setup({ experimentalVisible: true, featureFlagsVisible: true });
      const slots = result.current.topBarSlots;

      expect(findSlot(slots, "experimental")?.action.appearance).toBe("accent");
      expect(findSlot(slots, "feature flags")?.action.appearance).toBe("accent");
    });

    it("synchronize slot is not interactive when isRotating is true", () => {
      const { result } = setup({ isRotating: true });

      expect(findSlot(result.current.topBarSlots, "synchronize")?.action.isInteractive).toBe(false);
    });

    it("history slot carries cta text and Clock icon", () => {
      const { result } = setup({ operationsList: true });
      const historySlot = findSlot(result.current.topBarSlots, "history");

      expect(historySlot?.action.cta).toBe("History");
      expect(historySlot?.action.icon).toBe(Clock);
      expect(historySlot?.action.onClick).toBe(defaults.history.handleHistory);
    });
  });

  describe("inManager", () => {
    it("returns true when pathname is /manager", () => {
      const { result } = setup({ route: "/manager" });
      expect(result.current.inManager).toBe(true);
    });

    it("returns false for other pathnames", () => {
      const { result } = setup();
      expect(result.current.inManager).toBe(false);
    });
  });
});
