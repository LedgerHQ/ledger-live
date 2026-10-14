import Transport from "@ledgerhq/hw-transport";
import { firstValueFrom, from } from "rxjs";
import { withDevice } from "./deviceAccess";
import connectApp from "./connectApp";

jest.mock("./deviceAccess");
const mockedWithDevice = jest.mocked(withDevice);

describe("connectApp", () => {
  it("fails with DmkTransportRequired when the transport is not a DMK transport", async () => {
    mockedWithDevice.mockReturnValue(job => from(job(new Transport())));

    await expect(
      firstValueFrom(
        connectApp()({
          deviceId: "",
          deviceName: null,
          request: { appName: "Bitcoin", allowPartialDependencies: false },
        }),
      ),
    ).rejects.toMatchObject({ name: "DmkTransportRequired" });
  });
});
