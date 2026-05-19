import { DeviceActionStatus, type DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { SignerZcashBuilder } from "@ledgerhq/device-signer-kit-zcash";
import { DmkSignerZcash } from "../src/DmkSignerZcash";

jest.mock("@ledgerhq/device-signer-kit-zcash", () => ({
  SignerZcashBuilder: jest.fn(),
}));

describe("DmkSignerZcash", () => {
  const sessionId = "session-id";
  const dmkMock = {} as DeviceManagementKit;
  const mockSignerZcash = {
    getAddress: jest.fn(),
    getFullViewingKey: jest.fn(),
  };

  let signer: DmkSignerZcash;
  let buildMock: jest.Mock;

  const createCompletedObservable = <T>(output: T) => ({
    subscribe: ({
      next,
    }: {
      next: (state: { status: DeviceActionStatus.Completed; output: T }) => void;
    }) => {
      next({ status: DeviceActionStatus.Completed, output });
    },
  });

  const createErrorStatusObservable = <E extends { _tag: string }>(error: E) => ({
    subscribe: ({
      next,
    }: {
      next: (state: { status: DeviceActionStatus.Error; error: E }) => void;
    }) => {
      next({ status: DeviceActionStatus.Error, error });
    },
  });

  const createTransportErrorObservable = (error: Error) => ({
    subscribe: ({ error: onError }: { error: (error: Error) => void }) => {
      onError(error);
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    buildMock = jest.fn().mockReturnValue(mockSignerZcash);

    jest.mocked(SignerZcashBuilder).mockImplementation(() => {
      return {
        build: buildMock,
      } as unknown as SignerZcashBuilder;
    });

    signer = new DmkSignerZcash(dmkMock, sessionId);
  });

  describe("constructor", () => {
    it("should build signer with provided dmk and session id", () => {
      expect(SignerZcashBuilder).toHaveBeenCalledWith({ dmk: dmkMock, sessionId });
      expect(buildMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("getAddress", () => {
    const publicKey = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    const chainCode = new Uint8Array([0xca, 0xfe, 0xba, 0xbe]);

    it("should return address, publicKey, chainCode and pass checkOnDevice=false by default", async () => {
      mockSignerZcash.getAddress.mockReturnValue({
        observable: createCompletedObservable({ publicKey, address: "zs1abc", chainCode }),
      });

      const result = await signer.getAddress("44'/133'/0'/0/0");

      expect(result).toEqual({
        publicKey: "deadbeef",
        address: "zs1abc",
        chainCode: "cafebabe",
      });
      expect(mockSignerZcash.getAddress).toHaveBeenCalledWith("44'/133'/0'/0/0", {
        checkOnDevice: false,
        skipOpenApp: true,
      });
    });

    it("should pass checkOnDevice=true when display is true", async () => {
      mockSignerZcash.getAddress.mockReturnValue({
        observable: createCompletedObservable({ publicKey, address: "zs1display", chainCode }),
      });

      await signer.getAddress("44'/133'/0'/0/0", true);

      expect(mockSignerZcash.getAddress).toHaveBeenCalledWith("44'/133'/0'/0/0", {
        checkOnDevice: true,
        skipOpenApp: true,
      });
    });

    it("should reject with mapped error when device action returns error status", async () => {
      mockSignerZcash.getAddress.mockReturnValue({
        observable: createErrorStatusObservable({ _tag: "GetAddressDAError" }),
      });

      await expect(signer.getAddress("44'/133'/0'/0/0")).rejects.toThrow("GetAddressDAError");
    });

    it("should reject when observable emits transport error", async () => {
      mockSignerZcash.getAddress.mockReturnValue({
        observable: createTransportErrorObservable(new Error("transport error")),
      });

      await expect(signer.getAddress("44'/133'/0'/0/0")).rejects.toThrow("transport error");
    });
  });

  describe("getFullViewingKey", () => {
    it("should return UFVK and convert ZIP-44 path to ZIP-32", async () => {
      mockSignerZcash.getFullViewingKey.mockReturnValue({
        observable: createCompletedObservable({
          mode: "ufvk",
          fullViewingKey: "uview1test",
        }),
      });

      const result = await signer.getFullViewingKey("44'/133'/0'/0/0");

      expect(result).toEqual({ viewKey: "uview1test" });
      expect(mockSignerZcash.getFullViewingKey).toHaveBeenCalledWith("32'/133'/0'", {
        mode: "ufvk",
        skipOpenApp: true,
      });
    });

    it("should pass through ZIP-32 path", async () => {
      mockSignerZcash.getFullViewingKey.mockReturnValue({
        observable: createCompletedObservable({
          mode: "ufvk",
          fullViewingKey: "uview1zip32",
        }),
      });

      await signer.getFullViewingKey("32'/133'/2'");

      expect(mockSignerZcash.getFullViewingKey).toHaveBeenCalledWith("32'/133'/2'", {
        mode: "ufvk",
        skipOpenApp: true,
      });
    });

    it("should reject if returned mode is not ufvk", async () => {
      mockSignerZcash.getFullViewingKey.mockReturnValue({
        observable: createCompletedObservable({
          mode: "orchardFvk",
          fullViewingKey: new Uint8Array([1, 2, 3]),
        }),
      });

      await expect(signer.getFullViewingKey("44'/133'/0'/0/0")).rejects.toThrow(
        "Unexpected full viewing key response mode",
      );
    });
  });

  describe("not implemented methods", () => {
    it("should throw for getAppConfig", async () => {
      await expect(signer.getAppConfig()).rejects.toThrow("Not implemented");
    });

    it("should throw for getTrustedInput", async () => {
      await expect(signer.getTrustedInput()).rejects.toThrow("Not implemented");
    });

    it("should throw for signTransaction", async () => {
      await expect(signer.signTransaction("44'/133'/0'/0/0", "deadbeef")).rejects.toThrow(
        "Not implemented",
      );
    });

    it("should throw for signMessage", async () => {
      await expect(signer.signMessage("44'/133'/0'/0/0", "deadbeef")).rejects.toThrow(
        "Not implemented",
      );
    });
  });
});
