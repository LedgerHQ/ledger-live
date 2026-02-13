import { Eye, Refresh } from "@ledgerhq/lumen-ui-react/symbols";
import { renderHook } from "tests/testSetup";
import useTopBarViewModel from "../useTopBarViewModel";
import * as useActivityIndicatorModule from "../useActivityIndicator";
import * as useDiscreetModeModule from "../useDiscreetMode";

jest.mock("../useActivityIndicator");
jest.mock("../useDiscreetMode");

const mockUseActivityIndicator = jest.mocked(useActivityIndicatorModule.useActivityIndicator);
const mockUseDiscreetMode = jest.mocked(useDiscreetModeModule.useDiscreetMode);

describe("useTopBarViewModel", () => {
  const mockHandleSync = jest.fn();
  const mockHandleDiscreet = jest.fn();
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

  it("does not include synchronize slot when hasAccounts is false", () => {
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
  });

  it("includes notification slot and discreet action in correct order", () => {
    const { result } = renderHook(() => useTopBarViewModel());

    const notificationSlot = result.current.topBarSlots.find(s => s.type === "notification");
    expect(notificationSlot).toBeDefined();
    expect(notificationSlot).toEqual({ type: "notification" });

    const slotLabels = result.current.topBarSlots.map(s =>
      s.type === "action" ? s.action.label : "notification",
    );
    expect(slotLabels).toEqual(["synchronize", "notification", "discreet"]);

    const discreetSlot = result.current.topBarSlots.find(
      s => s.type === "action" && s.action.label === "discreet",
    );
    expect(discreetSlot).toBeDefined();
    if (discreetSlot?.type === "action") {
      expect(discreetSlot.action.onClick).toBe(mockHandleDiscreet);
      expect(discreetSlot.action.isInteractive).toBe(true);
    }
  });

  it("places notification slot 2nd (index 1) when hasAccounts, and 1st (index 0) when no accounts", () => {
    const { result } = renderHook(() => useTopBarViewModel());
    expect(result.current.topBarSlots[1].type).toBe("notification");

    mockUseActivityIndicator.mockReturnValue({
      hasAccounts: false,
      handleSync: mockHandleSync,
      isDisabled: false,
      isRotating: false,
      isError: false,
      tooltip: "Refresh",
      icon: Refresh,
    });
    const { result: resultNoAccounts } = renderHook(() => useTopBarViewModel());
    expect(resultNoAccounts.current.topBarSlots[0].type).toBe("notification");
    const slotLabels = resultNoAccounts.current.topBarSlots.map(s =>
      s.type === "action" ? s.action.label : "notification",
    );
    expect(slotLabels).toEqual(["notification", "discreet"]);
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
