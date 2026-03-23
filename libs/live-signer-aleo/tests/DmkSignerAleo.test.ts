import { DeviceActionStatus, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { of } from "rxjs";
import { DmkSignerAleo } from "../src/DmkSignerAleo";

describe("DmkSignerAleo", () => {
  let signer: DmkSignerAleo;
  const mockPath = "44'/683'/0'/0'";
  const dmkMock = {
    executeDeviceAction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    signer = new DmkSignerAleo(dmkMock as unknown as DeviceManagementKit, "sessionId");
  });

  describe("getAppConfig", () => {
    it("should return the app config", async () => {
      // GIVEN
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: { version: "1.0.0" },
        }),
      });

      // WHEN
      const result = await signer.getAppConfig();

      // THEN
      expect(result).toEqual({ version: "1.0.0" });
    });
  });

  describe("getAddress", () => {
    it("should return the address without display", async () => {
      // GIVEN
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: { address: "aleo1abc123" },
        }),
      });

      // WHEN
      const result = await signer.getAddress(mockPath);

      // THEN
      expect(result).toEqual({ address: "aleo1abc123" });
    });

    it("should return the address with display", async () => {
      // GIVEN
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: { address: "aleo1abc123" },
        }),
      });

      // WHEN
      const result = await signer.getAddress(mockPath, true);

      // THEN
      expect(result).toEqual({ address: "aleo1abc123" });
    });

    it("should throw LockedDeviceError when device is locked", async () => {
      // GIVEN
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "GetAddressDARejected", errorCode: "5515" },
        }),
      });

      // WHEN / THEN
      await expect(signer.getAddress(mockPath)).rejects.toThrow(LockedDeviceError);
    });

    it("should throw UserRefusedOnDevice when user refuses", async () => {
      // GIVEN
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "GetAddressDARejected", errorCode: "69f0" },
        }),
      });

      // WHEN / THEN
      await expect(signer.getAddress(mockPath)).rejects.toThrow(UserRefusedOnDevice);
    });

    it("should throw a generic error when device action has no errorCode", async () => {
      // GIVEN
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "GetAddressDARejected" },
        }),
      });

      // WHEN / THEN
      await expect(signer.getAddress(mockPath)).rejects.toThrow("GetAddressDARejected");
    });

    it("should throw a generic error when errorCode is present but unknown", async () => {
      // GIVEN
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "GetAddressDAUnknownError", errorCode: "unknown" },
        }),
      });

      // WHEN / THEN
      await expect(signer.getAddress(mockPath)).rejects.toThrow("GetAddressDAUnknownError");
    });

    it.each([
      DeviceActionStatus.NotStarted,
      DeviceActionStatus.Pending,
      DeviceActionStatus.Stopped,
    ])("should throw an error if the device action status is %s", async status => {
      // GIVEN
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({ status }),
      });

      // WHEN / THEN
      await expect(signer.getAddress(mockPath)).rejects.toThrow("Unknown device action status");
    });
  });

  describe("getViewKey", () => {
    it("should return the view key", async () => {
      // GIVEN
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: { viewKey: "AViewKey1abc123" },
        }),
      });

      // WHEN
      const result = await signer.getViewKey(mockPath);

      // THEN
      expect(result).toEqual({ viewKey: "AViewKey1abc123" });
    });
  });

  describe("signRootIntent", () => {
    it("should return the root intent signature", async () => {
      // GIVEN
      const rootIntent = Buffer.from("mockrootintent", "hex");
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: { tlvSignature: "root-sig-hex" },
        }),
      });

      // WHEN
      const result = await signer.signRootIntent(mockPath, rootIntent);

      // THEN
      expect(result).toEqual({ signature: "root-sig-hex" });
    });

    it("should throw LockedDeviceError when device is locked", async () => {
      // GIVEN
      const rootIntent = Buffer.from([]);
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "SignRootIntentDARejected", errorCode: "5515" },
        }),
      });

      // WHEN / THEN
      await expect(signer.signRootIntent(mockPath, rootIntent)).rejects.toThrow(LockedDeviceError);
    });
  });

  describe("signFeeIntent", () => {
    it("should return the fee intent signature", async () => {
      // GIVEN
      const feeIntent = Buffer.from("mockfeeintent", "hex");
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: { tlvSignature: "fee-sig-hex" },
        }),
      });

      // WHEN
      const result = await signer.signFeeIntent(feeIntent);

      // THEN
      expect(result).toEqual({ signature: "fee-sig-hex" });
    });

    it("should throw UserRefusedOnDevice when user refuses", async () => {
      // GIVEN
      const feeIntent = Buffer.from([]);
      dmkMock.executeDeviceAction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "SignFeeIntentDARejected", errorCode: "69f0" },
        }),
      });

      // WHEN / THEN
      await expect(signer.signFeeIntent(feeIntent)).rejects.toThrow(UserRefusedOnDevice);
    });
  });
});
