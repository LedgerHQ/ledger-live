import { renderHook } from "@testing-library/react-native";
import {
  useTrackTransactionChecksFlow,
  UseTrackTransactionChecksFlow,
} from "./useTrackTransactionChecksFlow";
import { track } from "../segment";
import { CONNECTION_TYPES } from "./variables";
import { DeviceInfo } from "@ledgerhq/types-live";
import { AppAndVersion } from "@ledgerhq/live-common/hw/connectApp";

jest.mock("../segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

describe("useTrackTransactionChecksFlow", () => {
  const deviceMock = {
    modelId: "Europa",
    wired: true,
  };

  const deviceInfoMock: DeviceInfo = {
    version: "2.0.0",
    hardwareVersion: 1,
    mcuVersion: "1.1.0",
    bootloaderVersion: "1.2.0",
    providerName: "Ledger",
    languageId: 1,
    majMin: "2.0",
    targetId: "0.0",
    isBootloader: false,
    isOSU: false,
    managerAllowed: false,
    pinValidated: false,
  };

  const appAndVersionMock: AppAndVersion = {
    name: "Bitcoin",
    version: "1.0.0",
    flags: 0x1234,
  };

  const defaultArgs: UseTrackTransactionChecksFlow = {
    location: "Transaction",
    device: deviceMock,
    deviceInfo: deviceInfoMock,
    appAndVersion: appAndVersionMock,
    transactionChecksOptInTriggered: false,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should track 'Transaction Check Opt-in Triggered' when transactionChecksOptInTriggered changes from false to true", () => {
    const { rerender } = renderHook(
      (props: UseTrackTransactionChecksFlow) => useTrackTransactionChecksFlow(props),
      {
        initialProps: { ...defaultArgs, transactionChecksOptInTriggered: false },
      },
    );

    rerender({ ...defaultArgs, transactionChecksOptInTriggered: true });

    expect(track).toHaveBeenCalledWith(
      "Transaction Check Opt-in Triggered",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLM",
        page: "Transaction",
        appName: "Bitcoin",
        appVersion: "1.0.0",
        appFlags: "4660",
        deviceInfoHardwareVersion: 1,
        deviceInfoMcuVersion: "1.1.0",
        deviceInfoBootloaderVersion: "1.2.0",
        deviceInfoProviderName: "Ledger",
        deviceInfoLanguageId: 1,
      }),
    );
  });

  it("should not track events if transactionChecksOptInTriggered is false", () => {
    renderHook((props: UseTrackTransactionChecksFlow) => useTrackTransactionChecksFlow(props), {
      initialProps: { ...defaultArgs, transactionChecksOptInTriggered: false },
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("should not track events if transactionChecksOptInTriggered is null", () => {
    renderHook((props: UseTrackTransactionChecksFlow) => useTrackTransactionChecksFlow(props), {
      initialProps: { ...defaultArgs, transactionChecksOptInTriggered: null },
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("should not track events if transactionChecksOptInTriggered is undefined", () => {
    renderHook((props: UseTrackTransactionChecksFlow) => useTrackTransactionChecksFlow(props), {
      initialProps: { ...defaultArgs, transactionChecksOptInTriggered: undefined },
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("should use 'unknown' as page when location is undefined", () => {
    renderHook((props: UseTrackTransactionChecksFlow) => useTrackTransactionChecksFlow(props), {
      initialProps: { ...defaultArgs, location: undefined, transactionChecksOptInTriggered: true },
    });

    expect(track).toHaveBeenCalledWith(
      "Transaction Check Opt-in Triggered",
      expect.objectContaining({
        page: "unknown",
      }),
    );
  });

  it("should include correct connection type based on device.wired", () => {
    const bleDeviceMock = { ...deviceMock, wired: false };

    renderHook((props: UseTrackTransactionChecksFlow) => useTrackTransactionChecksFlow(props), {
      initialProps: {
        ...defaultArgs,
        device: bleDeviceMock,
        transactionChecksOptInTriggered: true,
      },
    });

    expect(track).toHaveBeenCalledWith(
      "Transaction Check Opt-in Triggered",
      expect.objectContaining({
        connectionType: CONNECTION_TYPES.BLE,
      }),
    );
  });

  it("should only track once even if transactionChecksOptInTriggered remains true on rerender", () => {
    const { rerender } = renderHook(
      (props: UseTrackTransactionChecksFlow) => useTrackTransactionChecksFlow(props),
      {
        initialProps: { ...defaultArgs, transactionChecksOptInTriggered: true },
      },
    );

    // First render should trigger tracking
    expect(track).toHaveBeenCalledTimes(1);

    // Rerender with the same props
    rerender({ ...defaultArgs, transactionChecksOptInTriggered: true });

    // Should still only be called once
    expect(track).toHaveBeenCalledTimes(1);
  });

  it("should handle null deviceInfo and appAndVersion", () => {
    renderHook((props: UseTrackTransactionChecksFlow) => useTrackTransactionChecksFlow(props), {
      initialProps: {
        ...defaultArgs,
        deviceInfo: null,
        appAndVersion: null,
        transactionChecksOptInTriggered: true,
      },
    });

    expect(track).toHaveBeenCalledWith(
      "Transaction Check Opt-in Triggered",
      expect.objectContaining({
        deviceType: "Europa",
        connectionType: CONNECTION_TYPES.USB,
        platform: "LLM",
        page: "Transaction",
        appName: undefined,
        appVersion: undefined,
        appFlags: undefined,
        deviceInfoHardwareVersion: undefined,
        deviceInfoMcuVersion: undefined,
        deviceInfoBootloaderVersion: undefined,
        deviceInfoProviderName: undefined,
        deviceInfoLanguageId: undefined,
      }),
    );
  });
});
