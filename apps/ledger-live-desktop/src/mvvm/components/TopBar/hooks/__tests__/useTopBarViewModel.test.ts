import { Eye, Refresh, Settings } from "@ledgerhq/lumen-ui-react/symbols";
import { renderHook } from "tests/testSetup";
import useTopBarViewModel from "../useTopBarViewModel";
import * as useActivityIndicatorModule from "../useActivityIndicator";
import * as useDiscreetModeModule from "../useDiscreetMode";
import * as useSettingsModule from "../useSettings";

jest.mock("../useActivityIndicator");
jest.mock("../useDiscreetMode");
jest.mock("../useSettings");

const mockUseActivityIndicator = jest.mocked(useActivityIndicatorModule.useActivityIndicator);
const mockUseDiscreetMode = jest.mocked(useDiscreetModeModule.useDiscreetMode);
const mockUseSettings = jest.mocked(useSettingsModule.useSettings);

describe("useTopBarViewModel", () => {
  const mockHandleSync = jest.fn();
  const mockHandleDiscreet = jest.fn();
  const mockHandleSettings = jest.fn();
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
      isDisabled: false,
      isRotating: false,
      isError: false,
      tooltip: "Refresh",
      icon: Refresh,
    });
    mockUseSettings.mockReturnValue({
      handleSettings: mockHandleSettings,
      settingsIcon: Settings,
      tooltip: "Settings",
    });
  });

  it("returns topBarSlots with synchronize action when hasAccounts is true", () => {
    const { result } = renderHook(() => useTopBarViewModel());

    expect(result.current.topBarSlots).toBeDefined();
    const syncSlot = result.current.topBarSlots.find(
      s => s.type === "action" && s.action.label === "synchronize",
    );
    expect(syncSlot).toBeDefined();
    expect(syncSlot?.type).toBe("action");
    if (syncSlot?.type === "action") {
      expect(syncSlot.action.tooltip).toBe("Refresh");
      expect(syncSlot.action.isInteractive).toBe(true);
      expect(syncSlot.action.onClick).toBe(mockHandleSync);
      expect(syncSlot.action.icon).toBeDefined();
    }
  });

  it("includes notification slot, discreet action, and settings slot in correct order", () => {
    const { result } = renderHook(() => useTopBarViewModel());

    const notificationSlot = result.current.topBarSlots.find(s => s.type === "notification");
    expect(notificationSlot).toBeDefined();
    expect(notificationSlot).toEqual({ type: "notification" });

    const slotLabels = result.current.topBarSlots.map(s =>
      s.type === "action" ? s.action.label : "notification",
    );
    expect(slotLabels).toEqual(["synchronize", "notification", "discreet", "settings"]);

    const discreetSlot = result.current.topBarSlots.find(
      s => s.type === "action" && s.action.label === "discreet",
    );
    expect(discreetSlot).toBeDefined();
    if (discreetSlot?.type === "action") {
      expect(discreetSlot.action.onClick).toBe(mockHandleDiscreet);
      expect(discreetSlot.action.isInteractive).toBe(true);
    }

    const settingsSlot = result.current.topBarSlots.find(
      s => s.type === "action" && s.action.label === "settings",
    );
    expect(settingsSlot).toBeDefined();
    if (settingsSlot?.type === "action") {
      expect(settingsSlot.action.onClick).toBe(mockHandleSettings);
      expect(settingsSlot.action.tooltip).toBe("Settings");
      expect(settingsSlot.action.icon).toBe(Settings);
      expect(settingsSlot.action.isInteractive).toBe(true);
    }
  });

  it("does not include synchronize slot when hasAccounts is false and notification is first", () => {
    mockUseActivityIndicator.mockReturnValue({
      hasAccounts: false,
      handleSync: mockHandleSync,
      isDisabled: false,
      isRotating: false,
      isError: false,
      tooltip: "Refresh",
      icon: Refresh,
    });

    const { result } = renderHook(() => useTopBarViewModel());

    const syncSlot = result.current.topBarSlots.find(
      s => s.type === "action" && s.action.label === "synchronize",
    );
    expect(syncSlot).toBeUndefined();
    const slotLabels = result.current.topBarSlots.map(s =>
      s.type === "action" ? s.action.label : "notification",
    );
    expect(slotLabels).toEqual(["notification", "discreet", "settings"]);
  });

  it("passes isDisabled from useActivityIndicator as isInteractive false on sync action", () => {
    mockUseActivityIndicator.mockReturnValue({
      hasAccounts: true,
      handleSync: mockHandleSync,
      isDisabled: true,
      isRotating: true,
      isError: true,
      tooltip: "Error",
      icon: Refresh,
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
