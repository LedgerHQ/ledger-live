import Transport from "@ledgerhq/hw-transport";
import { firstValueFrom, from } from "rxjs";
import { withDevice } from "./deviceAccess";
import connectManager from "./connectManager";

jest.mock("./deviceAccess");
const mockedWithDevice = jest.mocked(withDevice);

describe("connectManager", () => {
  it("fails with DmkTransportRequired when the transport is not a DMK transport", async () => {
    mockedWithDevice.mockReturnValue(job => from(job(new Transport())));

    await expect(
      firstValueFrom(connectManager()({ deviceId: "", deviceName: null, request: null })),
    ).rejects.toMatchObject({ name: "DmkTransportRequired" });
  });
});
