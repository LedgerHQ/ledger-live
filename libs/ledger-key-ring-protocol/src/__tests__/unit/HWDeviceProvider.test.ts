import { of, throwError } from "rxjs";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { HWDeviceProvider } from "../../HWDeviceProvider";
import { TrustchainNotAllowed } from "../../errors";
import { WithDevice } from "../../types";

jest.mock("@ledgerhq/hw-ledger-key-ring-protocol", () => ({
  crypto: {},
  device: { apdu: jest.fn() },
}));

function failingWithDevice<Err extends Error>(error: Err): WithDevice {
  return (_device: string) => () => throwError(() => error);
}

function successWithDevice(value: unknown): WithDevice {
  return (_device: string) =>
    <T>() =>
      of(value as T);
}

describe("HWDeviceProvider.withHw", () => {
  const apiBaseURL = "https://test.api";
  const callbacks = {
    onStartRequestUserInteraction: jest.fn(),
    onEndRequestUserInteraction: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("resolves with the job result on success", async () => {
    const withDevice = successWithDevice("ok");
    const provider = new HWDeviceProvider(apiBaseURL, withDevice);
    const result = await provider.withHw("device-1", async () => "ok", callbacks);
    expect(result).toBe("ok");
    expect(callbacks.onStartRequestUserInteraction).toHaveBeenCalledTimes(1);
    expect(callbacks.onEndRequestUserInteraction).toHaveBeenCalledTimes(1);
  });

  it("calls onEndRequestUserInteraction even on error", async () => {
    const withDevice = failingWithDevice(new TransportStatusError(StatusCodes.SW_BAD_STATE));
    const provider = new HWDeviceProvider(apiBaseURL, withDevice);
    await expect(provider.withHw("device-1", async () => "ok", callbacks)).rejects.toThrow();
    expect(callbacks.onStartRequestUserInteraction).toHaveBeenCalledTimes(1);
    expect(callbacks.onEndRequestUserInteraction).toHaveBeenCalledTimes(1);
  });

  it("throws UserRefusedOnDevice on USER_REFUSED_ON_DEVICE (0x5501)", async () => {
    const withDevice = failingWithDevice(
      new TransportStatusError(StatusCodes.USER_REFUSED_ON_DEVICE),
    );
    const provider = new HWDeviceProvider(apiBaseURL, withDevice);
    await expect(provider.withHw("device-1", async () => "ok")).rejects.toThrow(
      UserRefusedOnDevice,
    );
  });

  it("throws UserRefusedOnDevice on CONDITIONS_OF_USE_NOT_SATISFIED (0x6985)", async () => {
    const withDevice = failingWithDevice(
      new TransportStatusError(StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED),
    );
    const provider = new HWDeviceProvider(apiBaseURL, withDevice);
    await expect(provider.withHw("device-1", async () => "ok")).rejects.toThrow(
      UserRefusedOnDevice,
    );
  });

  it("throws TrustchainNotAllowed and clears JWT on SW_BAD_STATE (0xB007)", async () => {
    const withDevice = failingWithDevice(new TransportStatusError(StatusCodes.SW_BAD_STATE));
    const provider = new HWDeviceProvider(apiBaseURL, withDevice);
    const clearJwtSpy = jest.spyOn(provider, "clearJwt");
    await expect(provider.withHw("device-1", async () => "ok")).rejects.toThrow(
      TrustchainNotAllowed,
    );
    expect(clearJwtSpy).toHaveBeenCalledTimes(1);
  });

  it("rethrows TransportStatusError for unknown status codes", async () => {
    const withDevice = failingWithDevice(new TransportStatusError(StatusCodes.INCORRECT_DATA));
    const provider = new HWDeviceProvider(apiBaseURL, withDevice);
    await expect(provider.withHw("device-1", async () => "ok")).rejects.toThrow(
      TransportStatusError,
    );
    await expect(provider.withHw("device-1", async () => "ok")).rejects.toMatchObject({
      statusCode: StatusCodes.INCORRECT_DATA,
    });
  });

  it("rethrows non-TransportStatusError errors as-is", async () => {
    const withDevice = failingWithDevice(new Error("transport disconnected"));
    const provider = new HWDeviceProvider(apiBaseURL, withDevice);
    await expect(provider.withHw("device-1", async () => "ok")).rejects.toThrow(
      "transport disconnected",
    );
  });
});
