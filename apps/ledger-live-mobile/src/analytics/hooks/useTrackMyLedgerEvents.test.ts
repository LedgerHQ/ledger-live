import {
  useTrackMyLedgerSectionEvents,
  UseTrackMyLedgerSectionEvents,
} from "./useTrackMyLedgerEvents";
import { track } from "../segment";
import { UserRefusedAllowManager, UserRefusedDeviceNameChange } from "@ledgerhq/errors";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";
import { renderHook } from "@testing-library/react-native";

jest.mock("../segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

describe("useTrackMyLedgerSectionEvents", () => {
  const deviceMock = {
    modelId: "nanoX",
    wired: false,
  };

  const defaultArgs: UseTrackMyLedgerSectionEvents = {
    location: HOOKS_TRACKING_LOCATIONS.myLedgerDashboard,
    device: deviceMock,
    allowManagerRequested: null,
    allowRenamingRequested: null,
    imageRemoveRequested: null,
    error: null,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should track 'Secure Channel approved' when allowManagerRequested changes from true to false", () => {
    const { rerender } = renderHook(
      (props: UseTrackMyLedgerSectionEvents) => useTrackMyLedgerSectionEvents(props),
      { initialProps: { ...defaultArgs, allowManagerRequested: true } },
    );

    rerender({ ...defaultArgs, allowManagerRequested: false });

    expect(track).toHaveBeenCalledWith(
      "Secure Channel approved",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Manager Dashboard",
      }),
    );
  });

  it("should track 'Renamed Device entered' when allowRenamingRequested changes from true to false", () => {
    const { rerender } = renderHook(
      (props: UseTrackMyLedgerSectionEvents) => useTrackMyLedgerSectionEvents(props),
      { initialProps: { ...defaultArgs, allowRenamingRequested: true } },
    );

    rerender({ ...defaultArgs, allowRenamingRequested: false });

    expect(track).toHaveBeenCalledWith(
      "Renamed Device entered",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Manager RenamedDevice",
      }),
    );
  });

  it("should track 'Custom Lock Screen Image removed' when imageRemoveRequested changes from true to false", () => {
    const { rerender } = renderHook(
      (props: UseTrackMyLedgerSectionEvents) => useTrackMyLedgerSectionEvents(props),
      { initialProps: { ...defaultArgs, imageRemoveRequested: true } },
    );

    rerender({ ...defaultArgs, imageRemoveRequested: false });

    expect(track).toHaveBeenCalledWith(
      "Custom Lock Screen Image removed",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Manager Dashboard",
      }),
    );
  });

  it("should track 'Secure Channel denied' when UserRefusedAllowManager error is thrown", () => {
    renderHook((props: UseTrackMyLedgerSectionEvents) => useTrackMyLedgerSectionEvents(props), {
      initialProps: { ...defaultArgs, error: new UserRefusedAllowManager() },
    });

    expect(track).toHaveBeenCalledWith(
      "Secure Channel denied",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Manager Dashboard",
      }),
    );
  });

  it("should track 'Renamed Device cancelled' when UserRefusedDeviceNameChange error is thrown", () => {
    renderHook((props: UseTrackMyLedgerSectionEvents) => useTrackMyLedgerSectionEvents(props), {
      initialProps: { ...defaultArgs, error: new UserRefusedDeviceNameChange() },
    });

    expect(track).toHaveBeenCalledWith(
      "Renamed Device cancelled",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Manager RenamedDevice",
      }),
    );
  });

  it("should use CONNECTION_TYPES.USB when the device is wired", () => {
    const wiredDeviceMock = { ...deviceMock, wired: true };

    const { rerender } = renderHook(
      (props: UseTrackMyLedgerSectionEvents) => useTrackMyLedgerSectionEvents(props),
      {
        initialProps: { ...defaultArgs, device: wiredDeviceMock, allowManagerRequested: true },
      },
    );

    rerender({ ...defaultArgs, device: wiredDeviceMock, allowManagerRequested: false });

    expect(track).toHaveBeenCalledWith(
      "Secure Channel approved",
      expect.objectContaining({
        deviceType: "nanoX",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLM",
        page: "Manager Dashboard",
      }),
    );
  });
});
