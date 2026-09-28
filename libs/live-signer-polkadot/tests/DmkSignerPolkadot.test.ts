/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { DmkSignerPolkadot } from "../src/DmkSignerPolkadot";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import {
  LockedDeviceError,
  UserRefusedAddress,
  UserRefusedOnDevice,
} from "@ledgerhq/hw-transport/errors";
import { of, throwError } from "rxjs";

jest.mock("@ledgerhq/device-signer-kit-polkadot", () => ({
  SignerPolkadotBuilder: jest.fn().mockImplementation(() => ({
    build: () => ({}),
  })),
}));

describe("DmkSignerPolkadot", () => {
  let signer: DmkSignerPolkadot;
  const dmkMock = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
    signer = new DmkSignerPolkadot(dmkMock, "sessionId");
  });

  describe("getAddress", () => {
    it("resolves with the mapped address on Completed status, forwarding the ss58 prefix unmodified", async () => {
      const publicKeyBytes = new Uint8Array([1, 2, 3]);
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: {
          address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
          publicKey: publicKeyBytes,
        },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      const result = await signer.getAddress("44/354/0/0/0", 0);

      expect((signer as any).signer.getAddress).toHaveBeenCalledWith(
        "44/354/0/0/0",
        0,
        expect.objectContaining({ skipOpenApp: true }),
      );
      expect(result).toEqual({
        pubKey: Buffer.from(publicKeyBytes).toString("hex"),
        address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        return_code: 0x9000,
      });
    });

    it("pads a short derivation path to 5 elements (scanAccounts probes the legacy/default derivation mode with fewer than 5)", async () => {
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: { address: "addr", publicKey: new Uint8Array([1]) },
      });
      const getAddress = jest.fn().mockReturnValue({ observable });
      (signer as any).signer = { getAddress };

      await signer.getAddress("44'/354'/0'", 0);

      expect(getAddress).toHaveBeenCalledWith(
        "44'/354'/0'/0/0",
        0,
        expect.objectContaining({ skipOpenApp: true }),
      );
    });

    it("never hardcodes the ss58 prefix — a non-zero value is forwarded as-is", async () => {
      const publicKeyBytes = new Uint8Array([4, 5, 6]);
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: { address: "some-address", publicKey: publicKeyBytes },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await signer.getAddress("44/354/0/0/0", 42, true);

      expect((signer as any).signer.getAddress).toHaveBeenCalledWith(
        "44/354/0/0/0",
        42,
        expect.objectContaining({ checkOnDevice: true, skipOpenApp: true }),
      );
    });

    it("passes skipOpenApp: true regardless of showAddrInDevice", async () => {
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: { address: "addr", publicKey: new Uint8Array([1]) },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await signer.getAddress("44/354/0/0/0", 0, false);

      expect((signer as any).signer.getAddress).toHaveBeenCalledWith(
        "44/354/0/0/0",
        0,
        expect.objectContaining({ skipOpenApp: true }),
      );
    });

    it("rejects with LockedDeviceError on error code 5515", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: {
          _tag: "GetAddressDAError",
          errorCode: "5515",
        },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddress("44/354/0/0/0", 0)).rejects.toThrow(LockedDeviceError);
    });

    it("rejects with UserRefusedAddress on error code 6986 (matches the legacy client's error type)", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: {
          _tag: "GetAddressDAError",
          errorCode: "6986",
        },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddress("44/354/0/0/0", 0)).rejects.toThrow(UserRefusedAddress);
    });

    it("rejects with a generic error carrying errorCode and message (never the raw command-error object) on an unmapped status word", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: {
          _tag: "GetAddressDAError",
          errorCode: "9999",
          message: "Data is invalid : some reason",
        },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddress("44/354/0/0/0", 0)).rejects.toThrow(
        "GetAddressDAError (9999): Data is invalid : some reason",
      );
    });

    it("rejects with a generic error when the error has no errorCode", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: {
          _tag: "GetAddressDAError",
        },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddress("44/354/0/0/0", 0)).rejects.toThrow("GetAddressDAError");
    });

    it("rejects the promise on a raw observable stream error (distinct from a mapped error state)", async () => {
      const observable = throwError(() => new Error("transport error"));
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddress("44/354/0/0/0", 0)).rejects.toThrow("transport error");
    });

    it("returns a Promise and never resolves synchronously off the subscription", () => {
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: { address: "addr", publicKey: new Uint8Array([1]) },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      const result = signer.getAddress("44/354/0/0/0", 0);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("sign", () => {
    it("converts the 0x-prefixed hex metadata into bytes before calling signTransaction", async () => {
      const signatureBytes = Uint8Array.from([0x00, 0xaa, 0xbb]);
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: signatureBytes,
      });
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      const message = new Uint8Array([1, 2, 3]);
      await signer.sign("44/354/0/0/0", message, "0x1234abcd");

      expect((signer as any).signer.signTransaction).toHaveBeenCalledWith(
        "44/354/0/0/0",
        message,
        Buffer.from("1234abcd", "hex"),
        expect.objectContaining({ skipOpenApp: true }),
      );
    });

    it("resolves with a hex signature (no 0x prefix), preserving all 65 bytes including the discriminant", async () => {
      const signatureBytes = Uint8Array.from([
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e,
        0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d,
        0x1e, 0x1f, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c,
        0x2d, 0x2e, 0x2f, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b,
        0x3c, 0x3d, 0x3e, 0x3f, 0x40,
      ]);
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: signatureBytes,
      });
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      const result = await signer.sign("44/354/0/0/0", new Uint8Array([1, 2, 3]), "0x1234abcd");

      expect(signatureBytes).toHaveLength(65);
      expect(result).toEqual({
        signature: Buffer.from(signatureBytes).toString("hex"),
        return_code: 0x9000,
      });
    });

    it("passes skipOpenApp: true", async () => {
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: Uint8Array.from([0x00, 0xaa]),
      });
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      await signer.sign("44/354/0/0/0", new Uint8Array([1]), "0x1234");

      expect((signer as any).signer.signTransaction).toHaveBeenCalledWith(
        "44/354/0/0/0",
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ skipOpenApp: true }),
      );
    });

    it("rejects with LockedDeviceError on error code 5515", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: {
          _tag: "SignTransactionDAError",
          errorCode: "5515",
        },
      });
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.sign("44/354/0/0/0", new Uint8Array([1]), "0x1234")).rejects.toThrow(
        LockedDeviceError,
      );
    });

    it("rejects with UserRefusedOnDevice on error code 6986", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: {
          _tag: "SignTransactionDAError",
          errorCode: "6986",
        },
      });
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.sign("44/354/0/0/0", new Uint8Array([1]), "0x1234")).rejects.toThrow(
        UserRefusedOnDevice,
      );
    });

    it("rejects with a generic error carrying errorCode and message (never the raw command-error object) on an unmapped status word", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: {
          _tag: "SignTransactionDAError",
          errorCode: "6984",
          message: "Data is invalid : some reason",
        },
      });
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.sign("44/354/0/0/0", new Uint8Array([1]), "0x1234")).rejects.toThrow(
        "SignTransactionDAError (6984): Data is invalid : some reason",
      );
    });

    it("rejects with a generic error when the error has no errorCode", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: {
          _tag: "SignTransactionDAError",
        },
      });
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.sign("44/354/0/0/0", new Uint8Array([1]), "0x1234")).rejects.toThrow(
        "SignTransactionDAError",
      );
    });

    it("rejects the promise on a raw observable stream error (distinct from a mapped error state)", async () => {
      const observable = throwError(() => new Error("sign stream error"));
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.sign("44/354/0/0/0", new Uint8Array([1]), "0x1234")).rejects.toThrow(
        "sign stream error",
      );
    });

    it("returns a Promise and never resolves synchronously off the subscription", () => {
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: Uint8Array.from([0x00, 0xaa]),
      });
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      const result = signer.sign("44/354/0/0/0", new Uint8Array([1]), "0x1234");
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
