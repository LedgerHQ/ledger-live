import { renderHook } from "@testing-library/react-native";
import { useTrackLedgerSyncFlow, UseTrackLedgerSyncFlow } from "./useTrackLedgerSyncFlow";
import { track } from "../segment";
import { UserRefusedOnDevice, UserRefusedAllowManager } from "@ledgerhq/errors";
import { CONNECTION_TYPES, HOOKS_TRACKING_LOCATIONS } from "./variables";

jest.mock("../segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

describe("useTrackLedgerSyncFlow", () => {
  const deviceMock = {
    modelId: "Europa",
    wired: false,
  };

  const defaultArgs: UseTrackLedgerSyncFlow = {
    location: HOOKS_TRACKING_LOCATIONS.ledgerSyncFlow,
    device: deviceMock,
    allowManagerRequested: null,
    requestOpenApp: null,
    error: null,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not track events if location is not 'Ledger Sync'", () => {
    renderHook((props: UseTrackLedgerSyncFlow) => useTrackLedgerSyncFlow(props), {
      // @ts-expect-error: location should come from HOOKS_TRACKING_LOCATIONS enum
      initialProps: { ...defaultArgs, location: "Other Location" },
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("should track 'Secure Channel approved' when allowManagerRequested transitions from true to false without error", () => {
    const { rerender } = renderHook(
      (props: UseTrackLedgerSyncFlow) => useTrackLedgerSyncFlow(props),
      {
        initialProps: { ...defaultArgs, allowManagerRequested: true },
      },
    );

    rerender({ ...defaultArgs, allowManagerRequested: false, error: null });

    expect(track).toHaveBeenCalledWith(
      "Secure Channel approved",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Ledger Sync",
      }),
    );
  });

  it("should track 'Open app denied' when previous requestOpenApp exists and error is UserRefusedOnDevice", () => {
    const { rerender } = renderHook(
      (props: UseTrackLedgerSyncFlow) => useTrackLedgerSyncFlow(props),
      {
        initialProps: { ...defaultArgs, requestOpenApp: "Bitcoin" },
      },
    );

    // @ts-expect-error requestOpenApp is not null
    rerender({ ...defaultArgs, requestOpenApp: null, error: new UserRefusedOnDevice() });

    expect(track).toHaveBeenCalledWith(
      "Open app denied",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Ledger Sync",
      }),
    );
  });

  it("should track 'Open app accepted' when previous requestOpenApp exists, requestOpenApp becomes null and no error", () => {
    const { rerender } = renderHook(
      (props: UseTrackLedgerSyncFlow) => useTrackLedgerSyncFlow(props),
      {
        initialProps: { ...defaultArgs, requestOpenApp: "Ethereum" },
      },
    );

    // @ts-expect-error requestOpenApp is not null
    rerender({ ...defaultArgs, requestOpenApp: null, error: null });

    expect(track).toHaveBeenCalledWith(
      "Open app accepted",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Ledger Sync",
      }),
    );
  });

  it("should track 'Secure Channel refused' when error is UserRefusedAllowManager", () => {
    const { rerender } = renderHook(
      (props: UseTrackLedgerSyncFlow) => useTrackLedgerSyncFlow(props),
      {
        initialProps: { ...defaultArgs, requestOpenApp: "Ethereum" },
      },
    );

    rerender({ ...defaultArgs, requestOpenApp: "Ethereum", error: new UserRefusedAllowManager() });

    expect(track).toHaveBeenCalledWith(
      "Secure Channel refused",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.BLE,
        platform: "LLM",
        page: "Ledger Sync",
      }),
    );
  });

  it("should use CONNECTION_TYPES.USB when the device is wired", () => {
    const wiredDevice = { ...deviceMock, wired: true };

    const { rerender } = renderHook(
      (props: UseTrackLedgerSyncFlow) => useTrackLedgerSyncFlow(props),
      {
        initialProps: { ...defaultArgs, device: wiredDevice, requestOpenApp: "Bitcoin" },
      },
    );

    rerender({
      ...defaultArgs,
      device: wiredDevice,
      // @ts-expect-error requestOpenApp is not null
      requestOpenApp: null,
      error: new UserRefusedOnDevice(),
    });

    expect(track).toHaveBeenCalledWith(
      "Open app denied",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLM",
        page: "Ledger Sync",
      }),
    );
  });
});
