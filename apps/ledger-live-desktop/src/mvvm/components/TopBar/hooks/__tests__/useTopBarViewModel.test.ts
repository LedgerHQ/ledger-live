import { Eye, Experiment, Refresh, Settings, Tools } from "@ledgerhq/lumen-ui-react/symbols";
import { renderHook } from "tests/testSetup";
import useTopBarViewModel from "../useTopBarViewModel";
import * as useActivityIndicatorModule from "../useActivityIndicator";
import * as useDiscreetModeModule from "../useDiscreetMode";
import * as useExperimentalFeaturesModule from "../useExperimentalFeatures";
import * as useFeatureFlagsModule from "../useFeatureFlags";
import * as useSettingsModule from "../useSettings";

jest.mock("../useActivityIndicator");
jest.mock("../useDiscreetMode");
jest.mock("../useExperimentalFeatures");
jest.mock("../useFeatureFlags");
jest.mock("../useSettings");

const mockUseActivityIndicator = jest.mocked(useActivityIndicatorModule.useActivityIndicator);
const mockUseDiscreetMode = jest.mocked(useDiscreetModeModule.useDiscreetMode);
const mockUseExperimentalFeatures = jest.mocked(
  useExperimentalFeaturesModule.useExperimentalFeatures,
);
const mockUseFeatureFlags = jest.mocked(useFeatureFlagsModule.useFeatureFlags);
const mockUseSettings = jest.mocked(useSettingsModule.useSettings);

describe("useTopBarViewModel", () => {
  const mockHandleSync = jest.fn();
  const mockHandleDiscreet = jest.fn();
  const mockHandleSettings = jest.fn();
  const mockHandleExperimental = jest.fn();
  const mockHandleFeatureFlags = jest.fn();
  const mockDiscreetIcon = Eye;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDiscreetMode.mockReturnValue({
      handleDiscreet: mockHandleDiscreet,
      discreetIcon: mockDiscreetIcon,
      tooltip: "Discreet tooltip",
    });
    mockUseActivityIndicator.mockReturnValue({
      hasAccounts: true,
      handleSync: mockHandleSync,
      isRotating: false,
      isError: false,
      tooltip: "Refresh",
      icon: Refresh,
      onTooltipShow: undefined,
    });
    mockUseSettings.mockReturnValue({
      handleSettings: mockHandleSettings,
      settingsIcon: Settings,
      tooltip: "Settings",
    });
    mockUseExperimentalFeatures.mockReturnValue({
      isVisible: false,
      handleExperimental: mockHandleExperimental,
      icon: Experiment,
      tooltip: "Experimental",
    });
    mockUseFeatureFlags.mockReturnValue({
      isVisible: false,
      handleFeatureFlags: mockHandleFeatureFlags,
      icon: Tools,
      tooltip: "Feature flags",
    });
  });

  it("returns topBarSlots in order: synchronize (when hasAccounts), notification, discreet, settings, my ledger", () => {
    const { result } = renderHook(() => useTopBarViewModel());

    const slotLabels = result.current.topBarSlots.map(s =>
      s.type === "action" ? s.action.label : "notification",
    );
    expect(slotLabels).toEqual([
      "synchronize",
      "notification",
      "discreet",
      "settings",
      "my ledger",
    ]);

    const myLedgerSlot = result.current.topBarSlots.find(
      s => s.type === "action" && s.action.label === "my ledger",
    );
    expect(myLedgerSlot).toBeDefined();

    const syncSlot = result.current.topBarSlots.find(
      s => s.type === "action" && s.action.label === "synchronize",
    );
    expect(syncSlot).toBeDefined();
    if (syncSlot?.type === "action") expect(syncSlot.action.onClick).toBe(mockHandleSync);

    const settingsSlot = result.current.topBarSlots.find(
      s => s.type === "action" && s.action.label === "settings",
    );
    expect(settingsSlot).toBeDefined();
    if (settingsSlot?.type === "action")
      expect(settingsSlot.action.onClick).toBe(mockHandleSettings);
  });

  it("does not include synchronize slot when hasAccounts is false and notification is first", () => {
    mockUseActivityIndicator.mockReturnValue({
      hasAccounts: false,
      handleSync: mockHandleSync,
      isRotating: false,
      isError: false,
      tooltip: "Refresh",
      icon: Refresh,
      onTooltipShow: undefined,
    });

    const { result } = renderHook(() => useTopBarViewModel());

    const syncSlot = result.current.topBarSlots.find(
      s => s.type === "action" && s.action.label === "synchronize",
    );
    expect(syncSlot).toBeUndefined();
    const slotLabels = result.current.topBarSlots.map(s =>
      s.type === "action" ? s.action.label : "notification",
    );
    expect(slotLabels).toEqual(["notification", "discreet", "settings", "my ledger"]);
  });

  it("includes experimental and feature flags slots with accent appearance when visible", () => {
    mockUseExperimentalFeatures.mockReturnValue({
      isVisible: true,
      handleExperimental: mockHandleExperimental,
      icon: Experiment,
      tooltip: "Experimental",
    });
    mockUseFeatureFlags.mockReturnValue({
      isVisible: true,
      handleFeatureFlags: mockHandleFeatureFlags,
      icon: Tools,
      tooltip: "Feature flags",
    });

    const { result } = renderHook(() => useTopBarViewModel());

    const slotLabels = result.current.topBarSlots.map(s =>
      s.type === "action" ? s.action.label : "notification",
    );
    expect(slotLabels).toEqual([
      "experimental",
      "feature flags",
      "synchronize",
      "notification",
      "discreet",
      "settings",
      "my ledger",
    ]);

    const experimentalSlot = result.current.topBarSlots.find(
      s => s.type === "action" && s.action.label === "experimental",
    );
    expect(experimentalSlot).toBeDefined();
    if (experimentalSlot?.type === "action") {
      expect(experimentalSlot.action.appearance).toBe("accent");
      expect(experimentalSlot.action.onClick).toBe(mockHandleExperimental);
    }

    const featureFlagsSlot = result.current.topBarSlots.find(
      s => s.type === "action" && s.action.label === "feature flags",
    );
    expect(featureFlagsSlot).toBeDefined();
    if (featureFlagsSlot?.type === "action") {
      expect(featureFlagsSlot.action.appearance).toBe("accent");
      expect(featureFlagsSlot.action.onClick).toBe(mockHandleFeatureFlags);
    }
  });

  it("passes isRotating from useActivityIndicator as isInteractive false on sync action", () => {
    const mockOnTooltipShow = jest.fn();
    mockUseActivityIndicator.mockReturnValue({
      hasAccounts: true,
      handleSync: mockHandleSync,
      isRotating: true,
      isError: true,
      tooltip: "Error",
      icon: Refresh,
      onTooltipShow: mockOnTooltipShow,
    });

    const { result } = renderHook(() => useTopBarViewModel());

    const syncSlot = result.current.topBarSlots.find(
      s => s.type === "action" && s.action.label === "synchronize",
    );
    expect(syncSlot).toBeDefined();
    if (syncSlot?.type === "action") {
      expect(syncSlot.action.isInteractive).toBe(false);
      expect(syncSlot.action.tooltip).toBe("Error");
    }
  });
});
