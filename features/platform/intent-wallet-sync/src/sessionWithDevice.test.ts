import { firstValueFrom, of, throwError } from "rxjs";
import { DeviceDisconnectedWhileSendingError } from "@ledgerhq/device-management-kit";
import { sessionWithDevice } from "./sessionWithDevice";

type SdkTransport = ReturnType<Parameters<typeof sessionWithDevice>[0]>;

function fakeTransport(name: string): SdkTransport {
  return { name } as unknown as SdkTransport;
}

function deviceJob(createTransport: () => SdkTransport) {
  return sessionWithDevice(createTransport)("any-device-id");
}

describe("sessionWithDevice", () => {
  it("should not create the transport before the job is subscribed", () => {
    const createTransport = jest.fn(() => fakeTransport("session"));

    deviceJob(createTransport)(transport => of(transport));

    expect(createTransport).not.toHaveBeenCalled();
  });

  it("should create one transport per subscription and run the job on it", async () => {
    const transports = [fakeTransport("first"), fakeTransport("second")];
    const createTransport = jest
      .fn<SdkTransport, []>()
      .mockReturnValueOnce(transports[0])
      .mockReturnValueOnce(transports[1]);
    const run = deviceJob(createTransport)(transport => of(transport));

    await expect(firstValueFrom(run)).resolves.toBe(transports[0]);
    await expect(firstValueFrom(run)).resolves.toBe(transports[1]);
    expect(createTransport).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["a job error", new Error("job failed")],
    ["a DMK disconnection", new DeviceDisconnectedWhileSendingError()],
  ])("should pass %s to the subscriber unchanged", async (_label, error) => {
    const run = deviceJob(() => fakeTransport("session"))(() => throwError(() => error));

    await expect(firstValueFrom(run)).rejects.toBe(error);
  });

  it("should pass an error of the transport factory to the subscriber unchanged", async () => {
    const error = new DeviceDisconnectedWhileSendingError();
    const job = jest.fn(() => of("never"));
    const run = deviceJob(() => {
      throw error;
    })(job);

    await expect(firstValueFrom(run)).rejects.toBe(error);
    expect(job).not.toHaveBeenCalled();
  });
});
