import { renderHook } from "tests/testSetup";
import { useTrackSyncFlow, UseTrackSyncFlow } from "./useTrackSyncFlow";
import { track } from "../segment";
import { UserRefusedAllowManager, UserRefusedOnDevice } from "@ledgerhq/errors";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

jest.mock("../segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

describe("useTrackSyncFlow", () => {
  const deviceMock = {
    modelId: "Europa",
    wired: true,
  };

  const defaultArgs: UseTrackSyncFlow = {
    location: HOOKS_TRACKING_LOCATIONS.ledgerSync,
    device: deviceMock,
    allowManagerRequested: null,
    error: null,
    isLedgerSyncAppOpen: false,
    isTrackingEnabled: true,
    requestOpenApp: null,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should track 'Secure Channel approved' when allowManagerRequested changes from true to false without error", () => {
    const { rerender } = renderHook((props: UseTrackSyncFlow) => useTrackSyncFlow(props), {
      initialProps: { ...defaultArgs, allowManagerRequested: true },
    });

    rerender({ ...defaultArgs, allowManagerRequested: false });

    expect(track).toHaveBeenCalledWith(
      "Secure Channel approved",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
        page: "Receive",
      }),
      true,
    );
  });

  it("should track 'Secure Channel refused' when UserRefusedAllowManager error is thrown", () => {
    const error = new UserRefusedAllowManager();

    renderHook((props: UseTrackSyncFlow) => useTrackSyncFlow(props), {
      initialProps: { ...defaultArgs, error },
    });

    expect(track).toHaveBeenCalledWith(
      "Secure Channel refused",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
        page: "Receive",
      }),
      true,
    );
  });

  it("should track 'User refused to open Ledger Sync app' when error is UserRefusedOnDevice", () => {
    const error = new UserRefusedOnDevice();

    renderHook((props: UseTrackSyncFlow) => useTrackSyncFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Ledger Sync", error },
    });

    expect(track).toHaveBeenCalledWith(
      "User refused to open Ledger Sync app",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
        page: "Receive",
      }),
      true,
    );
  });

  it("should track 'User opened Ledger Sync app' when isLedgerSyncAppOpen is true", () => {
    renderHook((props: UseTrackSyncFlow) => useTrackSyncFlow(props), {
      initialProps: { ...defaultArgs, requestOpenApp: "Ledger Sync", isLedgerSyncAppOpen: true },
    });

    expect(track).toHaveBeenCalledWith(
      "User opened Ledger Sync app",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLD",
        page: "Receive",
      }),
      true,
    );
  });

  it("should not track events if location is not 'Ledger Sync'", () => {
    renderHook((props: UseTrackSyncFlow) => useTrackSyncFlow(props), {
      //@ts-expect-error location should be HOOKS_TRACKING_LOCATIONS enum
      initialProps: { ...defaultArgs, location: "Other Location" },
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("should include correct connection type based on device.wired", () => {
    const bleDeviceMock = { ...deviceMock, wired: false };

    renderHook((props: UseTrackSyncFlow) => useTrackSyncFlow(props), {
      initialProps: {
        ...defaultArgs,
        device: bleDeviceMock,
        isLedgerSyncAppOpen: true,
      },
    });

    expect(track).toHaveBeenCalledWith(
      "User opened Ledger Sync app",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLD",
        page: "Receive",
      }),
      true,
    );
  });
});
