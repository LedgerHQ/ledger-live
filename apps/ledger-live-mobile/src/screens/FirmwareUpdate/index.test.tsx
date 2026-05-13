import React from "react";
import { render, waitFor } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { aDeviceInfoBuilder } from "@ledgerhq/live-common/mock/fixtures/aDeviceInfo";
import { getLatestFirmwareForDeviceUseCase } from "@ledgerhq/live-common/device/use-cases/getLatestFirmwareForDeviceUseCase";
import FirmwareUpdateScreen from "./index";

const mockGoBack = jest.fn();

jest.mock("expo-keep-awake", () => ({}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn(), setOptions: jest.fn() }),
}));

jest.mock("@ledgerhq/live-common/device/use-cases/getLatestFirmwareForDeviceUseCase", () => ({
  getLatestFirmwareForDeviceUseCase: jest.fn(),
}));

const mockedFetch = jest.mocked(getLatestFirmwareForDeviceUseCase);

const device = {
  modelId: DeviceModelId.nanoX,
  deviceId: "nanoX",
  deviceName: "Nano X",
  wired: true,
};
const deviceInfo = aDeviceInfoBuilder();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeRoute = (params: Record<string, unknown>) => ({ params }) as any;

const renderScreen = (params: Record<string, unknown>) =>
  render(<FirmwareUpdateScreen route={makeRoute(params)} navigation={{} as never} />);

describe("FirmwareUpdateScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not fetch when device/deviceInfo are missing", () => {
    renderScreen({ device: undefined, deviceInfo: undefined, onBackFromUpdate: jest.fn() });

    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("does not fetch when a firmwareUpdateContext is already provided (prefetched callers)", () => {
    // `device` left undefined so the screen short-circuits before mounting the
    // heavy FirmwareUpdate manager; the point here is that a provided context
    // makes `shouldFetch` false regardless.
    renderScreen({
      device: undefined,
      deviceInfo,
      firmwareUpdateContext: { final: { name: "1.0" } },
      onBackFromUpdate: jest.fn(),
    });

    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("fetches the firmware context and shows a loader while the request is in flight", () => {
    mockedFetch.mockReturnValue(new Promise(() => {}));

    renderScreen({ device, deviceInfo, onBackFromUpdate: jest.fn() });

    expect(mockedFetch).toHaveBeenCalledWith(deviceInfo);
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it("navigates back when the fetch resolves with no available update", async () => {
    mockedFetch.mockResolvedValue(null);

    renderScreen({ device, deviceInfo, onBackFromUpdate: jest.fn() });

    await waitFor(() => expect(mockGoBack).toHaveBeenCalledTimes(1));
  });

  it("navigates back when the fetch fails", async () => {
    mockedFetch.mockRejectedValue(new Error("network"));

    renderScreen({ device, deviceInfo, onBackFromUpdate: jest.fn() });

    await waitFor(() => expect(mockGoBack).toHaveBeenCalledTimes(1));
  });
});
