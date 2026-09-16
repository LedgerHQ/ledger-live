/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/hw-transport/errors";
import { of, throwError } from "rxjs";
import { DmkSignerTron } from "../src/DmkSignerTron";

jest.mock("@ledgerhq/device-signer-kit-tron", () => ({
  SignerTrxBuilder: jest.fn().mockImplementation(() => ({
    build: () => ({}),
  })),
}));

const PATH = "44'/195'/0'/0/0";

const stubDeviceAction = (
  signer: DmkSignerTron,
  method: "getAddress" | "signTransaction",
  observable: unknown,
): jest.Mock => {
  const mock = jest.fn().mockReturnValue({ observable });
  (signer as any).signer = { [method]: mock };
  return mock;
};

const errorState = (error: unknown) => of({ status: DeviceActionStatus.Error, error });

describe("DmkSignerTron", () => {
  let signer: DmkSignerTron;

  beforeEach(() => {
    jest.clearAllMocks();
    signer = new DmkSignerTron({} as any, "sessionId");
  });

  describe("getAddress", () => {
    const completed = (output: unknown) =>
      of(
        { status: DeviceActionStatus.Pending, intermediateValue: {} },
        { status: DeviceActionStatus.Completed, output },
      );

    it("returns the public key and address the app answered with", async () => {
      const getAddress = stubDeviceAction(
        signer,
        "getAddress",
        completed({
          publicKey: "0424e5f600b52bb3d9246d49c4ab1722ba7f32b7a3e4f9f2b8a1a28b9118cc36c4",
          address: "TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL",
        }),
      );

      const result = await signer.getAddress(PATH, true);

      expect(getAddress).toHaveBeenCalledWith(PATH, {
        checkOnDevice: true,
        skipOpenApp: true,
      });
      expect(result).toEqual({
        publicKey: "0424e5f600b52bb3d9246d49c4ab1722ba7f32b7a3e4f9f2b8a1a28b9118cc36c4",
        address: "TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL",
      });
    });

    it("defaults the on-device check to off, and always opens the app itself", async () => {
      const getAddress = stubDeviceAction(
        signer,
        "getAddress",
        completed({ publicKey: "0424", address: "TNPe" }),
      );

      const result = await signer.getAddress(PATH);

      expect(getAddress).toHaveBeenCalledWith(PATH, {
        checkOnDevice: false,
        skipOpenApp: true,
      });
      expect(result).toEqual({ publicKey: "0424", address: "TNPe" });
    });

    it("drops any chain code the kit returns, which TronAddress does not carry", async () => {
      stubDeviceAction(
        signer,
        "getAddress",
        completed({ publicKey: "0424", address: "TNPe", chainCode: "aa".repeat(32) }),
      );

      await expect(signer.getAddress(PATH)).resolves.toEqual({
        publicKey: "0424",
        address: "TNPe",
      });
    });

    it("surfaces a locked device as LockedDeviceError", async () => {
      stubDeviceAction(
        signer,
        "getAddress",
        errorState({ _tag: "TronAppCommandError", errorCode: "5515" }),
      );

      await expect(signer.getAddress(PATH)).rejects.toBeInstanceOf(LockedDeviceError);
    });

    it("surfaces an on-device rejection as UserRefusedOnDevice", async () => {
      stubDeviceAction(
        signer,
        "getAddress",
        errorState({ _tag: "TronAppCommandError", errorCode: "6985" }),
      );

      await expect(signer.getAddress(PATH)).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });
  });

  describe("sign", () => {
    const signature = Uint8Array.from([0x30, 0x45, 0xde, 0xad, 0xbe, 0xef]);
    const completed = of({ status: DeviceActionStatus.Completed, output: signature });

    it("passes the raw transaction through unchanged and hex-encodes the signature", async () => {
      const signTransaction = stubDeviceAction(signer, "signTransaction", completed);

      const result = await signer.sign(PATH, "0a02f5942208");

      expect(signTransaction).toHaveBeenCalledWith(
        PATH,
        Uint8Array.from([0x0a, 0x02, 0xf5, 0x94, 0x22, 0x08]),
        { skipOpenApp: true },
      );
      expect(result).toBe("3045deadbeef");
    });

    it("hands a blob larger than one APDU to the kit whole, for it to chunk", async () => {
      const signTransaction = stubDeviceAction(signer, "signTransaction", completed);

      await signer.sign(PATH, "ab".repeat(600));

      const [, blob] = signTransaction.mock.calls[0];
      expect((blob as Uint8Array).length).toBe(600);
    });

    it("surfaces a locked device as LockedDeviceError", async () => {
      stubDeviceAction(
        signer,
        "signTransaction",
        errorState({ _tag: "TronAppCommandError", errorCode: "5515" }),
      );

      await expect(signer.sign(PATH, "0a02")).rejects.toBeInstanceOf(LockedDeviceError);
    });

    it.each(["6985", "6982"])("surfaces status word %s as UserRefusedOnDevice", async errorCode => {
      stubDeviceAction(
        signer,
        "signTransaction",
        errorState({ _tag: "TronAppCommandError", errorCode }),
      );

      await expect(signer.sign(PATH, "0a02")).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });

    it("falls back to the error tag for an unmapped status word", async () => {
      stubDeviceAction(
        signer,
        "signTransaction",
        errorState({ _tag: "TronAppCommandError", errorCode: "6a8b" }),
      );

      await expect(signer.sign(PATH, "0a02")).rejects.toThrow("TronAppCommandError");
    });

    it("falls back to the error tag for an error with no status word", async () => {
      stubDeviceAction(signer, "signTransaction", errorState({ _tag: "DeviceLockedError" }));

      await expect(signer.sign(PATH, "0a02")).rejects.toThrow("DeviceLockedError");
    });

    it("propagates a failure of the device action observable itself", async () => {
      stubDeviceAction(
        signer,
        "signTransaction",
        throwError(() => new Error("transport gone")),
      );

      await expect(signer.sign(PATH, "0a02")).rejects.toThrow("transport gone");
    });
  });

  describe("device action ending without completing", () => {
    const nonTerminalStatuses = [
      DeviceActionStatus.NotStarted,
      DeviceActionStatus.Pending,
      DeviceActionStatus.Stopped,
    ];

    it.each(nonTerminalStatuses)("rejects when getAddress ends on %s", async status => {
      stubDeviceAction(signer, "getAddress", of({ status }));

      await expect(signer.getAddress(PATH)).rejects.toThrow("Unknown device action status");
    });

    it.each(nonTerminalStatuses)("rejects when sign ends on %s", async status => {
      stubDeviceAction(signer, "signTransaction", of({ status }));

      await expect(signer.sign(PATH, "0a02")).rejects.toThrow("Unknown device action status");
    });

    it("rejects on a status the kit does not define", async () => {
      stubDeviceAction(signer, "signTransaction", of({ status: "somethingElse" }));

      await expect(signer.sign(PATH, "0a02")).rejects.toThrow("Unknown device action status");
    });
  });
});
