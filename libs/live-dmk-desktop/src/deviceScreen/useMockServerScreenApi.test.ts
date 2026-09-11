import { renderHook } from "@testing-library/react";
import { DmkNetworkClientError } from "@ledgerhq/device-management-kit";
import { useMockServerScreenApi } from "./useMockServerScreenApi";

const mockGetScreenshot = jest.fn();
const mockGetDevice = jest.fn();
const mockPressButton = jest.fn();
const mockTouchScreen = jest.fn();

jest.mock("@ledgerhq/device-mockserver-client", () => ({
  MockClient: jest.fn().mockImplementation(() => ({
    getScreenshot: mockGetScreenshot,
    getDevice: mockGetDevice,
    pressButton: mockPressButton,
    touchScreen: mockTouchScreen,
  })),
}));

const httpError = (status: number) =>
  Object.assign(Object.create(DmkNetworkClientError.prototype), { status });

describe("useMockServerScreenApi", () => {
  beforeEach(() => jest.clearAllMocks());

  const render = (deviceId = "device-1") =>
    renderHook(() => useMockServerScreenApi(deviceId)).result.current;

  it("returns the captured screenshot", async () => {
    const blob = new Blob(["png"]);
    mockGetScreenshot.mockResolvedValue(blob);

    await expect(render().screenshot()).resolves.toBe(blob);
    expect(mockGetScreenshot).toHaveBeenCalledWith("device-1");
  });

  it("reports no screen when the device has no Speculos instance", async () => {
    mockGetScreenshot.mockRejectedValue(httpError(409));

    await expect(render().screenshot()).resolves.toBeNull();
  });

  it("propagates failures that are not a missing instance", async () => {
    mockGetScreenshot.mockRejectedValue(httpError(500));

    await expect(render().screenshot()).rejects.toMatchObject({ status: 500 });
  });

  it("falls back to the device record while no app is running", async () => {
    const device = { id: "device-1", name: "Ledger Stax" };
    mockGetDevice.mockResolvedValue(device);

    await expect(render().idle?.()).resolves.toEqual({ kind: "os-info", device });
  });

  it("forwards button presses to the device", async () => {
    await render().pressButton("left", "press");

    expect(mockPressButton).toHaveBeenCalledWith("device-1", "left", "press");
  });

  it("forwards touches in device pixels", async () => {
    await render().touch(120, 340, "release");

    expect(mockTouchScreen).toHaveBeenCalledWith("device-1", 120, 340, "release");
  });
});
