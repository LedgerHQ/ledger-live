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
  };

  let signer: DmkSignerZcash;
  let buildMock: jest.Mock;

  const createCompletedObservable = <T>(output: T) => ({
    subscribe: ({ next }: { next: (state: { status: DeviceActionStatus.Completed; output: T }) => void }) => {
      next({ status: DeviceActionStatus.Completed, output });
    },
  });

  const createErrorStatusObservable = <E extends { _tag: string }>(error: E) => ({
    subscribe: ({ next }: { next: (state: { status: DeviceActionStatus.Error; error: E }) => void }) => {
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
    it("should return address and pass checkOnDevice=false by default", async () => {
      mockSignerZcash.getAddress.mockReturnValue({
        observable: createCompletedObservable({ address: "zs1abc" }),
      });

      const result = await signer.getAddress("44'/133'/0'/0/0");

      expect(result).toEqual({ address: "zs1abc" });
      expect(mockSignerZcash.getAddress).toHaveBeenCalledWith("44'/133'/0'/0/0", {
        checkOnDevice: false,
        skipOpenApp: true,
      });
    });

    it("should pass checkOnDevice=true when display is true", async () => {
      mockSignerZcash.getAddress.mockReturnValue({
        observable: createCompletedObservable({ address: "zs1display" }),
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

  describe("not implemented methods", () => {
    it("should throw for getAppConfig", async () => {
      await expect(signer.getAppConfig()).rejects.toThrow("Not implemented");
    });

    it("should throw for getViewKey", async () => {
      await expect(signer.getViewKey("44'/133'/0'/0/0")).rejects.toThrow("Not implemented");
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
