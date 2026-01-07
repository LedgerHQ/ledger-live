import customLockScreenLoad from "./customLockScreenLoad";
import { DeviceModelId } from "@ledgerhq/devices";
import { CLSSupportedDeviceModelId } from "@ledgerhq/device-core";
import { lastValueFrom, of } from "rxjs";
import { ManagerNotEnoughSpaceError, StatusCodes, TransportError } from "@ledgerhq/errors";
import { ImageLoadRefusedOnDevice } from "../errors";

const mockTransport = {
  send: jest.fn(),
  getTraceContext: jest.fn(),
};
const mockWithTransport = jest.fn(
  (_deviceId: string, _options?: any) => callback =>
    callback({ transportRef: { current: mockTransport } }),
);
jest.mock("../deviceSDK/transports/core", () => ({
  withTransport: (deviceId: string, options?: any) => mockWithTransport(deviceId, options),
}));
jest.mock("./getDeviceInfo", () => jest.fn(() => of([])));

describe("customLockScreenLoad", () => {
  it("should load image on device", async () => {
    // given
    const request = {
      deviceModelId: DeviceModelId.stax as CLSSupportedDeviceModelId,
      hexImage: "hello_world",
    };
    mockTransport.send.mockResolvedValue(Buffer.from([0x42, 0x42, 0x43, 0x90, 0x00]));

    // when
    const ret = await lastValueFrom(
      await customLockScreenLoad({ deviceId: "deviceId", deviceName: null, request }),
    );

    // then
    expect(mockTransport.send).toHaveBeenNthCalledWith(
      1,
      0xe0,
      0x60,
      0x00,
      0x00,
      Buffer.from([0x00, 0x00, 0x00, 0x08]),
      [StatusCodes.NOT_ENOUGH_SPACE, StatusCodes.USER_REFUSED_ON_DEVICE, StatusCodes.OK],
    );
    expect(mockTransport.send).toHaveBeenNthCalledWith(
      2,
      0xe0,
      0x61,
      0x00,
      0x00,
      Buffer.from([0x00, 0x00, 0x00, 0x00, 0x90, 0x01, 0xa0, 0x02, 0x21, 0x00, 0x00, 0x00]),
    );
    expect(mockTransport.send).toHaveBeenNthCalledWith(
      3,
      0xe0,
      0x62,
      0x00,
      0x00,
      Buffer.from([]),
      [0x9000, 0x5501],
    );
    expect(ret).toStrictEqual({
      type: "imageLoaded",
      imageSize: 1111638928,
      imageHash: "424243",
    });
  });

  it.each([
    [
      "user refused on device",
      [0x55, 0x01],
      new ImageLoadRefusedOnDevice("5501", { productName: "Ledger Stax" }),
    ],
    ["not enough space", [0x51, 0x02], new ManagerNotEnoughSpaceError()],
    ["unexpected error", [0x42, 0x32], new TransportError("Unexpected device response", "4232")],
  ])("should return an error if %s", async (_errorStr, statusCode, error) => {
    // given
    const request = {
      deviceModelId: DeviceModelId.stax as CLSSupportedDeviceModelId,
      hexImage: "hello_world",
    };
    mockTransport.send.mockResolvedValue(Buffer.from(statusCode));

    // when
    try {
      await lastValueFrom(
        await customLockScreenLoad({ deviceId: "nanoX", deviceName: null, request }),
      );
    } catch (err) {
      expect(err).toStrictEqual(error);
    }
  });

  it("should pass deviceName to withTransport", async () => {
    const request = {
      deviceModelId: DeviceModelId.stax as CLSSupportedDeviceModelId,
      hexImage: "hello_world",
    };
    mockTransport.send.mockResolvedValue(Buffer.from([0x42, 0x42, 0x43, 0x90, 0x00]));

    await lastValueFrom(
      await customLockScreenLoad({ deviceId: "deviceId", deviceName: "My Device", request }),
    );

    expect(mockWithTransport).toHaveBeenCalledWith(
      "deviceId",
      expect.objectContaining({ matchDeviceByName: "My Device" }),
    );
  });
});
