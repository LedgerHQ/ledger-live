import { DeviceActionStatus, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { DmkSignerPolkadot } from "../src/DmkSignerPolkadot";

const mockBuild = jest.fn();

jest.mock("@ledgerhq/device-signer-kit-polkadot", () => ({
  SignerPolkadotBuilder: jest.fn().mockImplementation(() => ({
    build: mockBuild,
  })),
}));

function createMockObservable(states: Array<Record<string, unknown>>) {
  return {
    observable: {
      subscribe: ({ next, error }: { next: (s: unknown) => void; error: (e: unknown) => void }) => {
        try {
          for (const state of states) {
            next(state);
          }
        } catch (err) {
          error(err);
        }
      },
    },
  };
}

describe("DmkSignerPolkadot", () => {
  let signer: DmkSignerPolkadot;
  let mockDmkSigner: {
    getAddress: jest.Mock;
    signTransaction: jest.Mock;
  };

  beforeEach(() => {
    mockDmkSigner = {
      getAddress: jest.fn(),
      signTransaction: jest.fn(),
    };
    mockBuild.mockReturnValue(mockDmkSigner);
    signer = new DmkSignerPolkadot({} as DeviceManagementKit, "session-123");
  });

  describe("getAddress", () => {
    it("should resolve with correct PolkadotAddress when completed", async () => {
      const publicKey = new Uint8Array([0xab, 0xcd, 0xef]);
      mockDmkSigner.getAddress.mockReturnValue(
        createMockObservable([
          {
            status: DeviceActionStatus.Completed,
            output: { publicKey, address: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqWrztPu4T2ABCDEF" },
          },
        ]),
      );

      const result = await signer.getAddress("44'/354'/0'/0'/0'", 0);

      expect(result).toEqual({
        pubKey: "abcdef",
        address: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqWrztPu4T2ABCDEF",
        return_code: 0x9000,
      });
    });

    it("should pass ss58prefix and checkOnDevice to DMK signer", async () => {
      const publicKey = new Uint8Array([0x01]);
      mockDmkSigner.getAddress.mockReturnValue(
        createMockObservable([
          {
            status: DeviceActionStatus.Completed,
            output: { publicKey, address: "addr" },
          },
        ]),
      );

      await signer.getAddress("44'/354'/0'/0'/0'", 42, true);

      expect(mockDmkSigner.getAddress).toHaveBeenCalledWith("44'/354'/0'/0'/0'", 42, {
        checkOnDevice: true,
        skipOpenApp: true,
      });
    });

    it("should pass checkOnDevice as false when showAddrInDevice is undefined", async () => {
      const publicKey = new Uint8Array([0x01]);
      mockDmkSigner.getAddress.mockReturnValue(
        createMockObservable([
          {
            status: DeviceActionStatus.Completed,
            output: { publicKey, address: "addr" },
          },
        ]),
      );

      await signer.getAddress("44'/354'/0'/0'/0'", 0);

      expect(mockDmkSigner.getAddress).toHaveBeenCalledWith("44'/354'/0'/0'/0'", 0, {
        checkOnDevice: false,
        skipOpenApp: true,
      });
    });

    it("should reject with UserRefusedOnDevice when error code is 6985", async () => {
      mockDmkSigner.getAddress.mockReturnValue(
        createMockObservable([
          {
            status: DeviceActionStatus.Error,
            error: {
              _tag: "GetAddressDAError",
              originalError: { errorCode: "6985" },
            },
          },
        ]),
      );

      await expect(signer.getAddress("44'/354'/0'/0'/0'", 0)).rejects.toBeInstanceOf(
        UserRefusedOnDevice,
      );
    });

    it("should reject with UserRefusedOnDevice when error code is 6986", async () => {
      mockDmkSigner.getAddress.mockReturnValue(
        createMockObservable([
          {
            status: DeviceActionStatus.Error,
            error: {
              _tag: "GetAddressDAError",
              originalError: { errorCode: "6986" },
            },
          },
        ]),
      );

      await expect(signer.getAddress("44'/354'/0'/0'/0'", 0)).rejects.toBeInstanceOf(
        UserRefusedOnDevice,
      );
    });

    it("should reject with LockedDeviceError when error code is 5515", async () => {
      mockDmkSigner.getAddress.mockReturnValue(
        createMockObservable([
          {
            status: DeviceActionStatus.Error,
            error: {
              _tag: "GetAddressDAError",
              originalError: { errorCode: "5515" },
            },
          },
        ]),
      );

      await expect(signer.getAddress("44'/354'/0'/0'/0'", 0)).rejects.toBeInstanceOf(
        LockedDeviceError,
      );
    });

    it("should reject with generic error when error has no originalError", async () => {
      mockDmkSigner.getAddress.mockReturnValue(
        createMockObservable([
          {
            status: DeviceActionStatus.Error,
            error: {
              _tag: "UnknownError",
              originalError: null,
            },
          },
        ]),
      );

      await expect(signer.getAddress("44'/354'/0'/0'/0'", 0)).rejects.toThrow("UnknownError");
    });

    it("should reject on observable error callback", async () => {
      mockDmkSigner.getAddress.mockReturnValue({
        observable: {
          subscribe: ({ error }: { next: (s: unknown) => void; error: (e: unknown) => void }) => {
            error(new Error("transport error"));
          },
        },
      });

      await expect(signer.getAddress("44'/354'/0'/0'/0'", 0)).rejects.toThrow("transport error");
    });
  });

  describe("sign", () => {
    it("should resolve with hex-encoded signature when completed", async () => {
      const signature = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      mockDmkSigner.signTransaction.mockReturnValue(
        createMockObservable([
          {
            status: DeviceActionStatus.Completed,
            output: signature,
          },
        ]),
      );

      const result = await signer.sign(
        "44'/354'/0'/0'/0'",
        new Uint8Array([0xaa, 0xbb]),
        "0xdeadbeef",
      );

      expect(result).toEqual({
        signature: "01020304",
        return_code: 0x9000,
      });
    });

    it("should convert hex metadata string to Uint8Array before passing to DMK", async () => {
      const signature = new Uint8Array([0x01]);
      mockDmkSigner.signTransaction.mockReturnValue(
        createMockObservable([
          {
            status: DeviceActionStatus.Completed,
            output: signature,
          },
        ]),
      );

      const message = new Uint8Array([0x10, 0x20]);
      await signer.sign("44'/354'/0'/0'/0'", message, "0xaabbccdd");

      expect(mockDmkSigner.signTransaction).toHaveBeenCalledWith(
        "44'/354'/0'/0'/0'",
        message,
        new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]),
        { skipOpenApp: true },
      );
    });

    it("should reject with mapped error on Error status", async () => {
      mockDmkSigner.signTransaction.mockReturnValue(
        createMockObservable([
          {
            status: DeviceActionStatus.Error,
            error: {
              _tag: "SignTransactionDAError",
              originalError: { errorCode: "6985" },
            },
          },
        ]),
      );

      await expect(
        signer.sign("44'/354'/0'/0'/0'", new Uint8Array([0x01]), "0xaa"),
      ).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });

    it("should reject on observable error callback", async () => {
      mockDmkSigner.signTransaction.mockReturnValue({
        observable: {
          subscribe: ({ error }: { next: (s: unknown) => void; error: (e: unknown) => void }) => {
            error(new Error("device disconnected"));
          },
        },
      });

      await expect(
        signer.sign("44'/354'/0'/0'/0'", new Uint8Array([0x01]), "0xaa"),
      ).rejects.toThrow("device disconnected");
    });
  });
});
