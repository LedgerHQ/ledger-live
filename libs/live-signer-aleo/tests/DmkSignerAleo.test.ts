import { DeviceActionStatus, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { of } from "rxjs";
import { DmkSignerAleo } from "../src/DmkSignerAleo";

describe("DmkSignerAleo", () => {
  let signer: DmkSignerAleo;
  const path = "44'/683'/<account>'/0'/0'";
  const dmkMock = {
    executeDeviceAction: jest.fn(),
    sendApdu: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    signer = new DmkSignerAleo(dmkMock as unknown as DeviceManagementKit, "sessionId");
  });

  describe("getAddress", () => {
    it("should get the address without boolDisplay", async () => {
      // GIVEN
      const mockAddress = Buffer.from("mockAddress");
      dmkMock.sendApdu.mockResolvedValue({
        data: Array.from(Buffer.concat([Buffer.from([mockAddress.length]), mockAddress])),
        statusCode: [0x90, 0x00],
      });
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: {
            address: "address",
            publicKey: "publicKey",
            chainCode: undefined,
          },
        }),
      });

      // WHEN
      const result = await signer.getAddress(path);

      // THEN
      expect(dmkMock.sendApdu).toHaveBeenCalledWith({
        sessionId: "sessionId",
        apdu: expect.any(Buffer),
      });
      expect(result).toEqual(mockAddress);
    });

    it("should get the address with display", async () => {
      // GIVEN
      const mockAddress = Buffer.from("mockAddress");
      dmkMock.sendApdu.mockResolvedValue({
        data: Array.from(Buffer.concat([Buffer.from([mockAddress.length]), mockAddress])),
        statusCode: [0x90, 0x00],
      });

      // WHEN
      const result = await signer.getAddress(path, true);

      // THEN
      expect(dmkMock.sendApdu).toHaveBeenCalledWith({
        sessionId: "sessionId",
        apdu: expect.any(Buffer),
      });
      expect(result).toEqual(mockAddress);
    });
  });

  describe("getViewKey", () => {
    it("should get the view key", async () => {
      // GIVEN
      const mockViewKey = Buffer.from("mockViewKey");
      dmkMock.sendApdu.mockResolvedValue({
        data: Array.from(Buffer.concat([Buffer.from([mockViewKey.length]), mockViewKey])),
        statusCode: [0x90, 0x00],
      });

      // WHEN
      const result = await signer.getViewKey(path);

      // THEN
      expect(dmkMock.sendApdu).toHaveBeenCalledWith({
        sessionId: "sessionId",
        apdu: expect.any(Buffer),
      });
      expect(result).toEqual(mockViewKey);
    });
  });
});
