/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { DmkSignerCosmos } from "../src/DmkSignerCosmos";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { of, throwError } from "rxjs";

jest.mock("@ledgerhq/device-signer-kit-cosmos", () => ({
  SignerCosmosBuilder: jest.fn().mockImplementation(() => ({
    build: () => ({}),
  })),
}));

describe("DmkSignerCosmos", () => {
  let signer: DmkSignerCosmos;
  const dmkMock = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
    signer = new DmkSignerCosmos(dmkMock, "sessionId");
  });

  describe("getAddressAndPubKey", () => {
    it("resolves with address and public key on Completed status", async () => {
      const publicKeyBytes = new Uint8Array([1, 2, 3]);
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: { address: "cosmos1abc", publicKey: publicKeyBytes },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      const result = await signer.getAddressAndPubKey([44, 118, 0, 0, 0], "cosmos");

      expect((signer as any).signer.getAddress).toHaveBeenCalledWith(
        "44/118/0/0/0",
        "cosmos",
        expect.objectContaining({ checkOnDevice: false, skipOpenApp: true }),
      );
      expect(result).toEqual({
        bech32_address: "cosmos1abc",
        compressed_pk: Buffer.from(publicKeyBytes),
        return_code: 0x9000,
        error_message: "",
      });
    });

    it("resolves with display when boolDisplay is true", async () => {
      const publicKeyBytes = new Uint8Array([4, 5, 6]);
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: { address: "cosmos1xyz", publicKey: publicKeyBytes },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await signer.getAddressAndPubKey([44, 118, 0, 0, 0], "cosmos", true);

      expect((signer as any).signer.getAddress).toHaveBeenCalledWith(
        "44/118/0/0/0",
        "cosmos",
        expect.objectContaining({ checkOnDevice: true, skipOpenApp: true }),
      );
    });

    it("rejects with LockedDeviceError on error code 5515", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: {
          _tag: "GetAddressDAError",
          originalError: { errorCode: "5515" },
        },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddressAndPubKey([44, 118, 0, 0, 0], "cosmos")).rejects.toThrow(
        LockedDeviceError,
      );
    });

    it("rejects with UserRefusedOnDevice on error code 6986", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: {
          _tag: "GetAddressDAError",
          originalError: { errorCode: "6986" },
        },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddressAndPubKey([44, 118, 0, 0, 0], "cosmos")).rejects.toThrow(
        UserRefusedOnDevice,
      );
    });

    it("rejects with generic error on unknown error code", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: {
          _tag: "GetAddressDAError",
          originalError: { errorCode: "9999" },
        },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddressAndPubKey([44, 118, 0, 0, 0], "cosmos")).rejects.toThrow(
        "GetAddressDAError",
      );
    });

    it("rejects with error tag when originalError has no errorCode", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: {
          _tag: "GetAddressDAError",
          originalError: {},
        },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddressAndPubKey([44, 118, 0, 0, 0], "cosmos")).rejects.toThrow(
        "GetAddressDAError",
      );
    });

    it("rejects on observable error", async () => {
      const observable = throwError(() => new Error("transport error"));
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddressAndPubKey([44, 118, 0, 0, 0], "cosmos")).rejects.toThrow(
        "transport error",
      );
    });
  });

  describe("getAddress", () => {
    it("resolves with address and publicKey on Completed status", async () => {
      const publicKeyBytes = new Uint8Array([10, 20, 30]);
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: { address: "cosmos1def", publicKey: publicKeyBytes },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      const result = await signer.getAddress("44/118/0/0/0", "cosmos");

      expect((signer as any).signer.getAddress).toHaveBeenCalledWith(
        "44/118/0/0/0",
        "cosmos",
        expect.objectContaining({ checkOnDevice: false, skipOpenApp: true }),
      );
      expect(result).toEqual({
        publicKey: Buffer.from(publicKeyBytes).toString("hex"),
        address: "cosmos1def",
      });
    });

    it("resolves with display when boolDisplay is true", async () => {
      const publicKeyBytes = new Uint8Array([40, 50, 60]);
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: { address: "cosmos1ghi", publicKey: publicKeyBytes },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await signer.getAddress("44/118/0/0/0", "cosmos", true);

      expect((signer as any).signer.getAddress).toHaveBeenCalledWith(
        "44/118/0/0/0",
        "cosmos",
        expect.objectContaining({ checkOnDevice: true, skipOpenApp: true }),
      );
    });

    it("rejects with LockedDeviceError on error code 5515", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: {
          _tag: "GetAddressDAError",
          originalError: { errorCode: "5515" },
        },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddress("44/118/0/0/0", "cosmos")).rejects.toThrow(LockedDeviceError);
    });

    it("rejects on observable error", async () => {
      const observable = throwError(() => new Error("address error"));
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddress("44/118/0/0/0", "cosmos")).rejects.toThrow("address error");
    });
  });

  describe("sign", () => {
    it("resolves with signature buffer on Completed status", async () => {
      const signatureBytes = Uint8Array.from([0xaa, 0xbb, 0xcc]);
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: signatureBytes,
      });
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      const tx = Buffer.from("transaction-data");
      const result = await signer.sign([44, 118, 0, 0, 0], tx, "osmosis");

      expect((signer as any).signer.signTransaction).toHaveBeenCalledWith(
        "44/118/0/0/0",
        "osmosis",
        tx,
        expect.objectContaining({ skipOpenApp: true }),
      );
      expect(result).toEqual({
        signature: Buffer.from(signatureBytes),
        return_code: 0x9000,
      });
    });

    it("uses default HRP 'cosmos' when transactionType is not provided", async () => {
      const signatureBytes = Uint8Array.from([0xdd, 0xee]);
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: signatureBytes,
      });
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      const tx = Buffer.from("transaction-data");
      await signer.sign([44, 118, 0, 0, 0], tx);

      expect((signer as any).signer.signTransaction).toHaveBeenCalledWith(
        "44/118/0/0/0",
        "cosmos",
        tx,
        expect.objectContaining({ skipOpenApp: true }),
      );
    });

    it("rejects with UserRefusedOnDevice on error code 6986", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: {
          _tag: "SignTransactionDAError",
          originalError: { errorCode: "6986" },
        },
      });
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.sign([44, 118, 0, 0, 0], Buffer.from("tx"))).rejects.toThrow(
        UserRefusedOnDevice,
      );
    });

    it("rejects with LockedDeviceError on error code 5515", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: {
          _tag: "SignTransactionDAError",
          originalError: { errorCode: "5515" },
        },
      });
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.sign([44, 118, 0, 0, 0], Buffer.from("tx"))).rejects.toThrow(
        LockedDeviceError,
      );
    });

    it("rejects on observable error", async () => {
      const observable = throwError(() => new Error("sign error"));
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.sign([44, 118, 0, 0, 0], Buffer.from("tx"))).rejects.toThrow(
        "sign error",
      );
    });
  });
});
