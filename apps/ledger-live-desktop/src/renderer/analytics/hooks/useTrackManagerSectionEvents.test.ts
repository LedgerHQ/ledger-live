import { renderHook, act } from "tests/testUtils";
import {
  useTrackManagerSectionEvents,
  UseTrackManagerSectionEvents,
} from "./useTrackManagerSectionEvents";
import { track } from "../segment";
import {
  UserRefusedAllowManager,
  UserRefusedDeviceNameChange,
  UserRefusedFirmwareUpdate,
} from "@ledgerhq/errors";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

jest.mock("../segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

describe("useTrackManagerSectionEvents", () => {
  const deviceMock = {
    modelId: "europa",
    wired: true,
  };

  const defaultArgs: UseTrackManagerSectionEvents = {
    location: HOOKS_TRACKING_LOCATIONS.managerDashboard,
    device: deviceMock,
    allowManagerRequested: null,
    clsImageRemoved: null,
    error: null,
    isTrackingEnabled: true,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should track 'Secure Channel approved' when allowManagerRequested transitions from true to false without error", () => {
    const { rerender } = renderHook(
      (props: UseTrackManagerSectionEvents) => useTrackManagerSectionEvents(props),
      { initialProps: { ...defaultArgs, allowManagerRequested: true } },
    );

    act(() => {
      rerender({ ...defaultArgs, allowManagerRequested: false });
    });

    expect(track).toHaveBeenCalledWith(
      "Secure Channel approved",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
        page: HOOKS_TRACKING_LOCATIONS.managerDashboard,
      }),
      true,
    );
  });

  it("should track 'Deleted Custom Lock Screen' when clsImageRemoved is true", () => {
    const { rerender } = renderHook(
      (props: UseTrackManagerSectionEvents) => useTrackManagerSectionEvents(props),
      {
        initialProps: { ...defaultArgs, clsImageRemoved: false },
      },
    );

    act(() => {
      rerender({ ...defaultArgs, clsImageRemoved: true });
    });

    expect(track).toHaveBeenCalledWith(
      "Deleted Custom Lock Screen",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
        page: HOOKS_TRACKING_LOCATIONS.managerDashboard,
      }),
      true,
    );
  });

  it("should track 'Secure Channel denied' if UserRefusedAllowManager error is thrown", () => {
    const error = new UserRefusedAllowManager();

    renderHook((props: UseTrackManagerSectionEvents) => useTrackManagerSectionEvents(props), {
      initialProps: { ...defaultArgs, error },
    });

    expect(track).toHaveBeenCalledWith(
      "Secure Channel denied",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
        page: HOOKS_TRACKING_LOCATIONS.managerDashboard,
      }),
      true,
    );
  });

  it("should track 'Renamed Device cancelled' if UserRefusedDeviceNameChange error is thrown", () => {
    const error = new UserRefusedDeviceNameChange();

    renderHook((props: UseTrackManagerSectionEvents) => useTrackManagerSectionEvents(props), {
      initialProps: { ...defaultArgs, error },
    });

    expect(track).toHaveBeenCalledWith(
      "Renamed Device cancelled",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
        page: HOOKS_TRACKING_LOCATIONS.managerDashboard,
      }),
      true,
    );
  });

  it("should track 'User refused OS update via LL' if UserRefusedFirmwareUpdate error is thrown", () => {
    const error = new UserRefusedFirmwareUpdate();

    renderHook((props: UseTrackManagerSectionEvents) => useTrackManagerSectionEvents(props), {
      initialProps: { ...defaultArgs, error },
    });

    expect(track).toHaveBeenCalledWith(
      "User refused OS update via LL",
      expect.objectContaining({
        deviceType: "europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
        page: HOOKS_TRACKING_LOCATIONS.managerDashboard,
      }),
      true,
    );
  });
});
