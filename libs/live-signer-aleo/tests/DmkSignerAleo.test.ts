import { DeviceActionStatus, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { SignerAleoBuilder } from "@ledgerhq/device-signer-kit-aleo";
import { of } from "rxjs";
import { DmkSignerAleo } from "../src/DmkSignerAleo";

jest.mock("@ledgerhq/device-signer-kit-aleo", () => {
  return {
    SignerAleoBuilder: jest.fn(),
  };
});

describe("DmkSignerAleo", () => {
  let signer: DmkSignerAleo;
  const mockPath = "44'/683'/0'/0'";

  const mockSignerAleo = {
    getAppConfig: jest.fn(),
    getAddress: jest.fn(),
    getViewKey: jest.fn(),
    signRootIntent: jest.fn(),
    signFeeIntent: jest.fn(),
    signNestedCall: jest.fn(),
  };

  const dmkMock = {
    executeDeviceAction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(SignerAleoBuilder).mockImplementation(() => {
      return {
        build: () => mockSignerAleo,
      } as unknown as SignerAleoBuilder;
    });

    signer = new DmkSignerAleo(dmkMock as unknown as DeviceManagementKit, "sessionId");
  });

  describe("getAppConfig", () => {
    it("should return the app config and call signer with correct params", async () => {
      // GIVEN
      const getAppConfigMock: jest.Mock = mockSignerAleo.getAppConfig;
      getAppConfigMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: { version: "1.0.0" },
        }),
      });

      // WHEN
      const result = await signer.getAppConfig();

      // THEN
      expect(result).toEqual({ version: "1.0.0" });
      expect(mockSignerAleo.getAppConfig).toHaveBeenCalledWith();
    });

    it("should throw LockedDeviceError when device is locked", async () => {
      // GIVEN
      const getAppConfigMock: jest.Mock = mockSignerAleo.getAppConfig;
      getAppConfigMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "GetAppConfigDARejected", errorCode: "5515" },
        }),
      });

      // WHEN / THEN
      await expect(signer.getAppConfig()).rejects.toThrow(LockedDeviceError);
    });

    it("should throw UserRefusedOnDevice when user refuses", async () => {
      // GIVEN
      const getAppConfigMock: jest.Mock = mockSignerAleo.getAppConfig;
      getAppConfigMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "GetAppConfigDARejected", errorCode: "69f0" },
        }),
      });

      // WHEN / THEN
      await expect(signer.getAppConfig()).rejects.toThrow(UserRefusedOnDevice);
    });
  });

  describe("getAddress", () => {
    it("should return the address without display and call signer with correct params", async () => {
      // GIVEN
      const getAddressMock: jest.Mock = mockSignerAleo.getAddress;
      getAddressMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: { address: "aleo1abc123" },
        }),
      });

      // WHEN
      const result = await signer.getAddress(mockPath);

      // THEN
      expect(result).toEqual({ address: "aleo1abc123" });
      expect(mockSignerAleo.getAddress).toHaveBeenCalledWith(mockPath, {
        checkOnDevice: undefined,
        skipOpenApp: true,
      });
    });

    it("should return the address with display and call signer with correct params", async () => {
      // GIVEN
      const getAddressMock: jest.Mock = mockSignerAleo.getAddress;
      getAddressMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: { address: "aleo1abc123" },
        }),
      });

      // WHEN
      const result = await signer.getAddress(mockPath, true);

      // THEN
      expect(result).toEqual({ address: "aleo1abc123" });
      expect(mockSignerAleo.getAddress).toHaveBeenCalledWith(mockPath, {
        checkOnDevice: true,
        skipOpenApp: true,
      });
    });

    it("should throw LockedDeviceError when device is locked", async () => {
      // GIVEN
      const getAddressMock: jest.Mock = mockSignerAleo.getAddress;
      getAddressMock.mockReturnValue({
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
      const getAddressMock: jest.Mock = mockSignerAleo.getAddress;
      getAddressMock.mockReturnValue({
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
      const getAddressMock: jest.Mock = mockSignerAleo.getAddress;
      getAddressMock.mockReturnValue({
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
      const getAddressMock: jest.Mock = mockSignerAleo.getAddress;
      getAddressMock.mockReturnValue({
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
      const getAddressMock: jest.Mock = mockSignerAleo.getAddress;
      getAddressMock.mockReturnValue({
        observable: of({ status }),
      });

      // WHEN / THEN
      await expect(signer.getAddress(mockPath)).rejects.toThrow("Unknown device action status");
    });
  });

  describe("getViewKey", () => {
    it("should return the view key and call signer with correct params", async () => {
      // GIVEN
      const getViewKeyMock: jest.Mock = mockSignerAleo.getViewKey;
      getViewKeyMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: { viewKey: "AViewKey1abc123" },
        }),
      });

      // WHEN
      const result = await signer.getViewKey(mockPath);

      // THEN
      expect(result).toEqual({ viewKey: "AViewKey1abc123" });
      expect(mockSignerAleo.getViewKey).toHaveBeenCalledWith(mockPath, {
        skipOpenApp: true,
      });
    });

    it("should throw LockedDeviceError when device is locked", async () => {
      // GIVEN
      const getViewKeyMock: jest.Mock = mockSignerAleo.getViewKey;
      getViewKeyMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "GetViewKeyDARejected", errorCode: "5515" },
        }),
      });

      // WHEN / THEN
      await expect(signer.getViewKey(mockPath)).rejects.toThrow(LockedDeviceError);
    });

    it("should throw UserRefusedOnDevice when user refuses", async () => {
      // GIVEN
      const getViewKeyMock: jest.Mock = mockSignerAleo.getViewKey;
      getViewKeyMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "GetViewKeyDARejected", errorCode: "69f0" },
        }),
      });

      // WHEN / THEN
      await expect(signer.getViewKey(mockPath)).rejects.toThrow(UserRefusedOnDevice);
    });
  });

  describe("signRootIntent", () => {
    it("should return the root intent signature and call signer with correct params", async () => {
      // GIVEN
      const rootIntent = Buffer.from("mockrootintent", "hex");
      const signRootIntentMock: jest.Mock = mockSignerAleo.signRootIntent;
      signRootIntentMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: { tlvSignature: "root-sig-hex" },
        }),
      });

      // WHEN
      const result = await signer.signRootIntent(mockPath, rootIntent);

      // THEN
      expect(result).toEqual({ signature: "root-sig-hex" });
      expect(mockSignerAleo.signRootIntent).toHaveBeenCalledWith(
        mockPath,
        new Uint8Array(rootIntent),
        { skipOpenApp: true },
      );
    });

    it("should throw LockedDeviceError when device is locked", async () => {
      // GIVEN
      const rootIntent = Buffer.from([]);
      const signRootIntentMock: jest.Mock = mockSignerAleo.signRootIntent;
      signRootIntentMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "SignRootIntentDARejected", errorCode: "5515" },
        }),
      });

      // WHEN / THEN
      await expect(signer.signRootIntent(mockPath, rootIntent)).rejects.toThrow(LockedDeviceError);
    });

    it("should throw UserRefusedOnDevice when user refuses", async () => {
      // GIVEN
      const rootIntent = Buffer.from([]);
      const signRootIntentMock: jest.Mock = mockSignerAleo.signRootIntent;
      signRootIntentMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "SignRootIntentDARejected", errorCode: "69f0" },
        }),
      });

      // WHEN / THEN
      await expect(signer.signRootIntent(mockPath, rootIntent)).rejects.toThrow(
        UserRefusedOnDevice,
      );
    });
  });

  describe("signFeeIntent", () => {
    it("should return the fee intent signature and call signer with correct params", async () => {
      // GIVEN
      const feeIntent = Buffer.from("mockfeeintent", "hex");
      const signFeeIntentMock: jest.Mock = mockSignerAleo.signFeeIntent;
      signFeeIntentMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: { tlvSignature: "fee-sig-hex" },
        }),
      });

      // WHEN
      const result = await signer.signFeeIntent(feeIntent);

      // THEN
      expect(result).toEqual({ signature: "fee-sig-hex" });
      expect(mockSignerAleo.signFeeIntent).toHaveBeenCalledWith(new Uint8Array(feeIntent), {
        skipOpenApp: true,
      });
    });

    it("should throw LockedDeviceError when device is locked", async () => {
      // GIVEN
      const feeIntent = Buffer.from([]);
      const signFeeIntentMock: jest.Mock = mockSignerAleo.signFeeIntent;
      signFeeIntentMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "SignFeeIntentDARejected", errorCode: "5515" },
        }),
      });

      // WHEN / THEN
      await expect(signer.signFeeIntent(feeIntent)).rejects.toThrow(LockedDeviceError);
    });

    it("should throw UserRefusedOnDevice when user refuses", async () => {
      // GIVEN
      const feeIntent = Buffer.from([]);
      const signFeeIntentMock: jest.Mock = mockSignerAleo.signFeeIntent;
      signFeeIntentMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "SignFeeIntentDARejected", errorCode: "69f0" },
        }),
      });

      // WHEN / THEN
      await expect(signer.signFeeIntent(feeIntent)).rejects.toThrow(UserRefusedOnDevice);
    });
  });

  describe("signNestedCall", () => {
    it("should return the nested call signature and call signer with correct params", async () => {
      // GIVEN
      const nestedCallRequest = Buffer.from("deadbeef", "hex");
      const signNestedCallMock: jest.Mock = mockSignerAleo.signNestedCall;
      signNestedCallMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: { tlvSignature: "nested-sig-hex" },
        }),
      });

      // WHEN
      const result = await signer.signNestedCall(nestedCallRequest);

      // THEN
      expect(result).toEqual({ signature: "nested-sig-hex" });
      expect(mockSignerAleo.signNestedCall).toHaveBeenCalledWith(
        new Uint8Array(nestedCallRequest),
        { skipOpenApp: true },
      );
    });

    it("should throw LockedDeviceError when device is locked", async () => {
      // GIVEN
      const nestedCallRequest = Buffer.from([]);
      const signNestedCallMock: jest.Mock = mockSignerAleo.signNestedCall;
      signNestedCallMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "SignNestedCallDARejected", errorCode: "5515" },
        }),
      });

      // WHEN / THEN
      await expect(signer.signNestedCall(nestedCallRequest)).rejects.toThrow(LockedDeviceError);
    });

    it("should throw UserRefusedOnDevice when user refuses", async () => {
      // GIVEN
      const nestedCallRequest = Buffer.from([]);
      const signNestedCallMock: jest.Mock = mockSignerAleo.signNestedCall;
      signNestedCallMock.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "SignNestedCallDARejected", errorCode: "69f0" },
        }),
      });

      // WHEN / THEN
      await expect(signer.signNestedCall(nestedCallRequest)).rejects.toThrow(UserRefusedOnDevice);
    });
  });
});
