import { DeviceActionStatus, type DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  LockedDeviceError,
  UserRefusedAddress,
  UserRefusedOnDevice,
} from "@ledgerhq/hw-transport/errors";
import { of } from "rxjs";
import { DmkSignerHedera, toKeyIndex } from "../src/DmkSignerHedera";

const kit = {
  getPublicKey: jest.fn(),
  signTransaction: jest.fn(),
};

jest.mock("../src/kit/SignerHedera", () => ({
  SignerHederaBuilder: jest.fn().mockImplementation(() => ({ build: () => kit })),
}));

const PATH = "44/3030";
const PUBLIC_KEY = "ab".repeat(32);
const SIGNATURE = new Uint8Array(64).fill(7);
const BODY = Uint8Array.from([1, 2, 3]);

const completed = (output: unknown) => ({
  observable: of(
    { status: DeviceActionStatus.Pending },
    { status: DeviceActionStatus.Completed, output },
  ),
});
const failed = (error: unknown) => ({
  observable: of({ status: DeviceActionStatus.Error, error }),
});

describe("toKeyIndex", () => {
  it.each([PATH, `m/${PATH}`])("should map %s to key index 0", path => {
    expect(toKeyIndex(path)).toBe(0);
  });

  it.each(["44'/3030'", "44'/3030'/0'/0'/0'", "44/3030/1", ""])(
    "should refuse %p, which hw-app-hedera would not derive as key 0",
    path => {
      expect(() => toKeyIndex(path)).toThrow("Unsupported Hedera derivation path");
    },
  );
});

describe("DmkSignerHedera", () => {
  let signer: DmkSignerHedera;

  beforeEach(() => {
    jest.clearAllMocks();
    signer = new DmkSignerHedera({} as DeviceManagementKit, "sessionId");
  });

  describe("getPublicKey", () => {
    it("should read key index 0 silently, as hw-app-hedera does", async () => {
      kit.getPublicKey.mockReturnValue(completed(PUBLIC_KEY));

      const result = await signer.getPublicKey(PATH);

      expect(kit.getPublicKey).toHaveBeenCalledTimes(1);
      expect(kit.getPublicKey).toHaveBeenCalledWith(0, { skipOpenApp: true });
      expect(result).toBe(PUBLIC_KEY);
    });

    it("should reject an unsupported path before reaching the device", async () => {
      await expect(signer.getPublicKey("44'/3030'/0'/0'/0'")).rejects.toThrow(
        "Unsupported Hedera derivation path",
      );
      expect(kit.getPublicKey).not.toHaveBeenCalled();
    });

    it("should map a user rejection to UserRefusedAddress", async () => {
      kit.getPublicKey.mockReturnValue(
        failed({ _tag: "HederaAppCommandError", errorCode: "6985" }),
      );

      await expect(signer.getPublicKey(PATH)).rejects.toBeInstanceOf(UserRefusedAddress);
    });

    it("should map a locked device to LockedDeviceError", async () => {
      kit.getPublicKey.mockReturnValue(failed({ _tag: "DeviceLockedError", errorCode: "5515" }));

      await expect(signer.getPublicKey(PATH)).rejects.toBeInstanceOf(LockedDeviceError);
    });
  });

  describe("signTransaction", () => {
    it("should sign the body with key index 0 and return the raw signature", async () => {
      kit.signTransaction.mockReturnValue(completed(SIGNATURE));

      const result = await signer.signTransaction(BODY);

      expect(kit.signTransaction).toHaveBeenCalledTimes(1);
      expect(kit.signTransaction).toHaveBeenCalledWith(0, BODY, { skipOpenApp: true });
      expect(result).toBe(SIGNATURE);
    });

    it("should map a user rejection to UserRefusedOnDevice", async () => {
      kit.signTransaction.mockReturnValue(
        failed({ _tag: "HederaAppCommandError", errorCode: "6985" }),
      );

      await expect(signer.signTransaction(BODY)).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });

    it("should surface an unknown status word with its tag and code", async () => {
      kit.signTransaction.mockReturnValue(
        failed({ _tag: "HederaAppCommandError", errorCode: "6e00" }),
      );

      await expect(signer.signTransaction(BODY)).rejects.toThrow(
        "HederaAppCommandError (errorCode: 6e00)",
      );
    });

    it("should surface an error without a status word by its tag", async () => {
      kit.signTransaction.mockReturnValue(failed({ _tag: "OpenAppDAError" }));

      await expect(signer.signTransaction(BODY)).rejects.toThrow("OpenAppDAError");
    });

    it("should fail when the device action ends without a result", async () => {
      kit.signTransaction.mockReturnValue({
        observable: of({ status: DeviceActionStatus.Stopped }),
      });

      await expect(signer.signTransaction(BODY)).rejects.toThrow("Unexpected device action status");
    });
  });
});
