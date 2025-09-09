/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
// tests/DMKSignerSolana.test.ts
import { DMKSignerSolana } from "../src/DMKSignerSolana";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import { PubKeyDisplayMode } from "@ledgerhq/coin-solana/signer";
import bs58 from "bs58";
import { of, throwError } from "rxjs";

// Mock the SignerSolanaBuilder to avoid actual builder logic
jest.mock("@ledgerhq/device-signer-kit-solana", () => ({
  SignerSolanaBuilder: jest.fn().mockImplementation(() => ({
    build: () => ({}),
  })),
}));

describe("DMKSignerSolana", () => {
  let signer: DMKSignerSolana;
  const dmkMock = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
    signer = new DMKSignerSolana(dmkMock, "sessionId");
  });

  describe("getAppConfiguration", () => {
    it("resolves with LONG mode when pubKeyDisplayMode is long", async () => {
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: { version: "1.0.0", blindSigningEnabled: true, pubKeyDisplayMode: "long" },
      });
      // Override the internal DMK signer
      (signer as any).dmkSigner = {
        getAppConfiguration: jest.fn().mockReturnValue({ observable }),
      };

      const config = await signer.getAppConfiguration();
      expect(config).toEqual({
        version: "1.0.0",
        blindSigningEnabled: true,
        pubKeyDisplayMode: PubKeyDisplayMode.LONG,
      });
    });

    it("resolves with SHORT mode when pubKeyDisplayMode is short", async () => {
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: { version: "2.0.0", blindSigningEnabled: false, pubKeyDisplayMode: "short" },
      });
      (signer as any).dmkSigner = {
        getAppConfiguration: jest.fn().mockReturnValue({ observable }),
      };

      const config = await signer.getAppConfiguration();
      expect(config).toEqual({
        version: "2.0.0",
        blindSigningEnabled: false,
        pubKeyDisplayMode: PubKeyDisplayMode.SHORT,
      });
    });

    it("rejects on observable error", async () => {
      const observable = throwError(() => new Error("test error"));
      (signer as any).dmkSigner = {
        getAppConfiguration: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAppConfiguration()).rejects.toThrow("test error");
    });
  });

  describe("getAddress", () => {
    it("returns decoded address without display", async () => {
      const bytes = Buffer.from([1, 2, 3]);
      const addressString = bs58.encode(bytes);
      const observable = of({ status: DeviceActionStatus.Completed, output: addressString });
      (signer as any).dmkSigner = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      const result = await signer.getAddress("m/0'/0'");
      expect((signer as any).dmkSigner.getAddress).toHaveBeenCalledWith(
        "m/0'/0'",
        expect.objectContaining({
          checkOnDevice: false,
          skipOpenApp: true,
        }),
      );
      expect(result).toEqual({ address: bytes });
    });

    it("returns decoded address with display", async () => {
      const bytes = Buffer.from([4, 5, 6]);
      const addressString = bs58.encode(bytes);
      const observable = of({ status: DeviceActionStatus.Completed, output: addressString });
      (signer as any).dmkSigner = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      const result = await signer.getAddress("m/1'/0'", true);
      expect((signer as any).dmkSigner.getAddress).toHaveBeenCalledWith(
        "m/1'/0'",
        expect.objectContaining({
          checkOnDevice: true,
          skipOpenApp: true,
        }),
      );
      expect(result).toEqual({ address: bytes });
    });

    it("rejects on observable error", async () => {
      const observable = throwError(() => new Error("address error"));
      (signer as any).dmkSigner = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddress("path")).rejects.toThrow("address error");
    });
  });

  describe("signTransaction", () => {
    it("resolves with signature buffer on Completed status", async () => {
      const outputArray = Uint8Array.from([10, 20, 30]);
      const observable = of({ status: DeviceActionStatus.Completed, output: outputArray });
      (signer as any).dmkSigner = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      const tx = Uint8Array.from([0xaa, 0xbb]);
      const result = await signer.signTransaction("path", tx);
      expect((signer as any).dmkSigner.signTransaction).toHaveBeenCalledWith(
        "path",
        tx,
        expect.objectContaining({
          transactionResolutionContext: undefined,
          skipOpenApp: true,
        }),
      );
      expect(result).toEqual({ signature: Buffer.from(outputArray) });
    });

    it("rejects on observable error", async () => {
      const observable = throwError(() => new Error("tx error"));
      (signer as any).dmkSigner = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.signTransaction("path", new Uint8Array())).rejects.toThrow("tx error");
    });
  });

  describe("signMessage", () => {
    it("resolves with signature buffer on Completed status", async () => {
      const signatureResponse = { signature: Uint8Array.from([100, 200]) };
      const observable = of({ status: DeviceActionStatus.Completed, output: signatureResponse });
      (signer as any).dmkSigner = {
        signMessage: jest.fn().mockReturnValue({ observable }),
      };

      const result = await signer.signMessage("path", "f0cacc1a");
      expect((signer as any).dmkSigner.signMessage).toHaveBeenCalledWith(
        "path",
        "f0cacc1a",
        expect.objectContaining({ skipOpenApp: true }),
      );
      expect(result).toEqual({ signature: Buffer.from(signatureResponse.signature) });
    });

    it("rejects on observable error", async () => {
      const observable = throwError(() => new Error("msg error"));
      (signer as any).dmkSigner = {
        signMessage: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.signMessage("path", "f0cacc1a")).rejects.toThrow("msg error");
    });
  });
});
