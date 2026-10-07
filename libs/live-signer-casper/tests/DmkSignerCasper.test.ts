import { DeviceActionStatus, type DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  LockedDeviceError,
  UserRefusedAddress,
  UserRefusedOnDevice,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { of } from "rxjs";
import { DmkSignerCasper } from "../src/DmkSignerCasper";

const kit = {
  getAddress: jest.fn(),
  signTransaction: jest.fn(),
};

jest.mock("@ledgerhq/device-signer-kit-casper", () => ({
  SignerCasperBuilder: jest.fn().mockImplementation(() => ({ build: () => kit })),
}));

const DERIVATION_PATH = "44'/506'/0'/0/0";
const PUBLIC_KEY = "028b2ddbe59976ad2f4138ca46553866de5124d13db4e13611ca751eedde9e0297";
const ADDRESS = "02028b2ddbe59976AD2f4138CA46553866De5124d13dB4e13611CA751EeddE9E0297";
const R = "aa".repeat(32);
const S = "bb".repeat(32);

const completed = (output: unknown) => ({
  observable: of(
    { status: DeviceActionStatus.Pending },
    { status: DeviceActionStatus.Completed, output },
  ),
});
const failed = (error: unknown) => ({
  observable: of({ status: DeviceActionStatus.Error, error }),
});

describe("DmkSignerCasper", () => {
  let signer: DmkSignerCasper;

  beforeEach(() => {
    jest.clearAllMocks();
    signer = new DmkSignerCasper({} as DeviceManagementKit, "sessionId");
  });

  describe("getAddressAndPubKey", () => {
    it("should map the kit output to the legacy response shape without on-device check", async () => {
      kit.getAddress.mockReturnValue(completed({ publicKey: PUBLIC_KEY, address: ADDRESS }));

      const result = await signer.getAddressAndPubKey(DERIVATION_PATH);

      expect(kit.getAddress).toHaveBeenCalledTimes(1);
      expect(kit.getAddress).toHaveBeenCalledWith(DERIVATION_PATH, {
        checkOnDevice: false,
        skipOpenApp: true,
      });
      expect(result).toEqual({
        returnCode: 0x9000,
        errorMessage: "",
        publicKey: Buffer.from(PUBLIC_KEY, "hex"),
        Address: ADDRESS,
      });
    });

    it("should strip the m/ prefix when the path carries one", async () => {
      kit.getAddress.mockReturnValue(completed({ publicKey: PUBLIC_KEY, address: ADDRESS }));

      await signer.getAddressAndPubKey(`m/${DERIVATION_PATH}`);

      expect(kit.getAddress).toHaveBeenCalledTimes(1);
      expect(kit.getAddress).toHaveBeenCalledWith(DERIVATION_PATH, expect.anything());
    });

    it("should reject with LockedDeviceError when the device is locked", async () => {
      kit.getAddress.mockReturnValue(failed({ _tag: "DeviceLockedError", errorCode: "5515" }));

      await expect(signer.getAddressAndPubKey(DERIVATION_PATH)).rejects.toThrow(LockedDeviceError);
    });

    it("should reject with the error tag when the error carries no status word", async () => {
      kit.getAddress.mockReturnValue(failed({ _tag: "OpenAppDAError" }));

      await expect(signer.getAddressAndPubKey(DERIVATION_PATH)).rejects.toThrow("OpenAppDAError");
    });
  });

  describe("showAddressAndPubKey", () => {
    it("should ask the kit to verify the address on device", async () => {
      kit.getAddress.mockReturnValue(completed({ publicKey: PUBLIC_KEY, address: ADDRESS }));

      const result = await signer.showAddressAndPubKey(DERIVATION_PATH);

      expect(kit.getAddress).toHaveBeenCalledTimes(1);
      expect(kit.getAddress).toHaveBeenCalledWith(DERIVATION_PATH, {
        checkOnDevice: true,
        skipOpenApp: true,
      });
      expect(result.Address).toBe(ADDRESS);
    });

    it("should reject with UserRefusedAddress when the user rejects on device", async () => {
      kit.getAddress.mockReturnValue(failed({ _tag: "CasperAppCommandError", errorCode: "6986" }));

      await expect(signer.showAddressAndPubKey(DERIVATION_PATH)).rejects.toThrow(
        UserRefusedAddress,
      );
    });

    it("should keep LockedDeviceError when the device is locked", async () => {
      kit.getAddress.mockReturnValue(failed({ _tag: "DeviceLockedError", errorCode: "5515" }));

      await expect(signer.showAddressAndPubKey(DERIVATION_PATH)).rejects.toThrow(LockedDeviceError);
    });
  });

  describe("sign", () => {
    it("should pass the transaction bytes and return the untagged r‖s signature", async () => {
      kit.signTransaction.mockReturnValue(completed({ r: R, s: S, v: 1, der: "3044" }));
      const message = Buffer.from("0103000000", "hex");

      const result = await signer.sign(DERIVATION_PATH, message);

      expect(kit.signTransaction).toHaveBeenCalledTimes(1);
      expect(kit.signTransaction).toHaveBeenCalledWith(DERIVATION_PATH, new Uint8Array(message), {
        skipOpenApp: true,
      });
      expect(result.returnCode).toBe(0x9000);
      expect(result.signatureRS).toEqual(Buffer.from(R + S, "hex"));
      expect(result.signatureRSV).toEqual(Buffer.from(R + S + "01", "hex"));
    });

    it("should reject with UserRefusedOnDevice when the user rejects on device", async () => {
      kit.signTransaction.mockReturnValue(
        failed({ _tag: "CasperAppCommandError", errorCode: "6986" }),
      );

      await expect(signer.sign(DERIVATION_PATH, Buffer.alloc(4))).rejects.toThrow(
        UserRefusedOnDevice,
      );
    });

    it("should reject with LockedDeviceError when the device is locked", async () => {
      kit.signTransaction.mockReturnValue(failed({ _tag: "DeviceLockedError", errorCode: "5515" }));

      await expect(signer.sign(DERIVATION_PATH, Buffer.alloc(4))).rejects.toThrow(
        LockedDeviceError,
      );
    });

    it("should keep the tag and status word when the app reports another error", async () => {
      kit.signTransaction.mockReturnValue(
        failed({ _tag: "CasperAppCommandError", errorCode: "6984" }),
      );

      await expect(signer.sign(DERIVATION_PATH, Buffer.alloc(4))).rejects.toThrow(
        "CasperAppCommandError (errorCode: 6984)",
      );
    });

    it("should throw when the device action never reaches a terminal status", async () => {
      kit.signTransaction.mockReturnValue({
        observable: of({ status: DeviceActionStatus.Pending }),
      });

      await expect(signer.sign(DERIVATION_PATH, Buffer.alloc(4))).rejects.toThrow(
        "Unexpected device action status",
      );
    });
  });
});
