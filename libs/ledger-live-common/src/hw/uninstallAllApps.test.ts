import { StatusCodes, UserRefusedOnDevice } from "@ledgerhq/errors";
import { command as uninstallAllApps } from "./uninstallAllApps";
import Transport from "@ledgerhq/hw-transport";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore next-line
const mockTransportGenerator = out => ({ send: () => out }) as Transport;

describe("uninstallAllApps", () => {
  test("should complete with TRUE if user approves", async () => {
    const mockedTransport: Transport = mockTransportGenerator(
      Buffer.from(StatusCodes.OK.toString(16), "hex"),
    );
    await expect(uninstallAllApps(mockedTransport)).resolves.toBeTruthy();
  });

  test("should complete with FALSE if the APDU is unavailable", async () => {
    const mockedTransport: Transport = mockTransportGenerator(
      Buffer.from(StatusCodes.UNKNOWN_APDU.toString(16), "hex"),
    );
    await expect(uninstallAllApps(mockedTransport)).resolves.toBeFalsy();
  });

  test("should fail with correct error if user refuses", async () => {
    const mockedTransport: Transport = mockTransportGenerator(
      Buffer.from(StatusCodes.USER_REFUSED_ON_DEVICE.toString(16), "hex"),
    );
    await expect(uninstallAllApps(mockedTransport)).rejects.toThrow(UserRefusedOnDevice);
  });

  test("should throw if any other status", async () => {
    const mockedTransport: Transport = mockTransportGenerator(
      Buffer.from(StatusCodes.INS_NOT_SUPPORTED.toString(16), "hex"),
    );
    await expect(uninstallAllApps(mockedTransport)).rejects.toThrow(Error);
  });
});
