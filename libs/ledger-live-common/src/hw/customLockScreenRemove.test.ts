import { StatusCodes, UnexpectedBootloader, UserRefusedOnDevice } from "@ledgerhq/errors";
import removeImage, { command } from "./customLockScreenRemove";
import Transport from "@ledgerhq/hw-transport";
import { ImageDoesNotExistOnDevice } from "../errors";
import { withDevice } from "./deviceAccess";
import { from } from "rxjs";
import getDeviceInfo from "./getDeviceInfo";
import { DeviceInfo } from "@ledgerhq/types-live";

jest.mock("./deviceAccess");
const mockedWithDevice = jest.mocked(withDevice);
function mockWithDevice(transport: Transport) {
  mockedWithDevice.mockReturnValue(job => from(job(transport)));
}

jest.mock("./getDeviceInfo");
const mockedGetDeviceInfo = jest.mocked(getDeviceInfo);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore next-line
const mockTransportGenerator = out => ({ send: () => out }) as Transport;

describe("customLockScreenRemove", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should succeed if user approves", async () => {
    const mockedTransport: Transport = mockTransportGenerator(
      Buffer.from(StatusCodes.OK.toString(16), "hex"),
    );
    await expect(command(mockedTransport)).resolves.toBeUndefined();
  });

  test("should fail with correct error if user refuses", async () => {
    const mockedTransport: Transport = mockTransportGenerator(
      Buffer.from(StatusCodes.USER_REFUSED_ON_DEVICE.toString(16), "hex"),
    );
    await expect(command(mockedTransport)).rejects.toThrow(UserRefusedOnDevice);
  });

  test("should throw if user refuses", async () => {
    const mockedTransport: Transport = mockTransportGenerator(
      Buffer.from(StatusCodes.USER_REFUSED_ON_DEVICE.toString(16), "hex"),
    );
    await expect(command(mockedTransport)).rejects.toThrow(Error);
  });

  test("missing image, should throw", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from(StatusCodes.CUSTOM_IMAGE_EMPTY.toString(16), "hex"),
    );
    await expect(command(mockedTransport)).rejects.toThrow(ImageDoesNotExistOnDevice);
  });

  test("unexpected bootloader or any other code, should throw", async () => {
    const mockedTransport = mockTransportGenerator(
      Buffer.from(StatusCodes.DEVICE_IN_RECOVERY_MODE.toString(16), "hex"),
    );
    await expect(command(mockedTransport)).rejects.toThrow(UnexpectedBootloader);
  });
});

describe("removeImage deviceAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithDevice(new Transport());
  });

  it('should emit an "unresponsiveDevice" event if getDeviceInfo takes too long', done => {
    mockedGetDeviceInfo.mockImplementation(() => new Promise(() => {}));

    removeImage({ deviceId: "deviceId", request: {} }).subscribe({
      next: event => {
        if (!event) {
          done(new Error("unexpected undefined event"));
        }
        const { type } = event;
        if (type === "unresponsiveDevice") {
          done();
        } else {
          done(new Error("unexpected event"));
        }
      },
      error: err => {
        done(err); // it should not error
      },
    });
  });

  it("should error if getDeviceInfo fails", done => {
    mockedGetDeviceInfo.mockRejectedValue(new Error("failed"));

    removeImage({ deviceId: "deviceId", request: {} }).subscribe({
      next: () => {
        done(new Error("unexpected event"));
      },
      error: err => {
        try {
          expect(err).toMatchObject(new Error("failed"));
          done();
        } catch (e) {
          done(e);
        }
      },
    });
  });

  it("should complete with the correct events in case of success", done => {
    mockedGetDeviceInfo.mockResolvedValue({} as DeviceInfo);
    mockWithDevice(mockTransportGenerator(Buffer.from(StatusCodes.OK.toString(16), "hex")));

    const expectedEventTypes = ["removeImagePermissionRequested", "imageRemoved"];
    const observedEventTypes: string[] = [];

    removeImage({ deviceId: "deviceId", request: {} }).subscribe({
      next: event => {
        if (!event) {
          done(new Error("unexpected undefined event"));
        }
        const { type } = event;
        observedEventTypes.push(type);
      },
      complete: () => {
        try {
          expect(observedEventTypes).toEqual(expectedEventTypes);
          done();
        } catch (e) {
          done(e);
        }
      },
      error: err => {
        done(err); // it should not error
      },
    });
  });

  it("should complete with the correct events in case of failure", done => {
    mockedGetDeviceInfo.mockResolvedValue({} as DeviceInfo);
    mockWithDevice(
      mockTransportGenerator(Buffer.from(StatusCodes.USER_REFUSED_ON_DEVICE.toString(16), "hex")),
    );

    const expectedEventTypes = ["removeImagePermissionRequested"];
    const observedEventTypes: string[] = [];

    removeImage({ deviceId: "deviceId", request: {} }).subscribe({
      next: event => {
        if (!event) {
          done(new Error("unexpected undefined event"));
        }
        const { type } = event;
        observedEventTypes.push(type);
      },
      complete: () => {
        done(new Error("unexpected completion"));
      },
      error: err => {
        try {
          expect(observedEventTypes).toEqual(expectedEventTypes);
          expect(err).toMatchObject(new UserRefusedOnDevice());
          done();
        } catch (e) {
          done(e); // it should not error
        }
      },
    });
  });
});
