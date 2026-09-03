/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/hw-transport/errors";
import { of, throwError } from "rxjs";
import { DmkSignerXrp } from "../src/DmkSignerXrp";

jest.mock("@ledgerhq/device-signer-kit-xrp", () => ({
  SignerXrpBuilder: jest.fn().mockImplementation(() => ({
    build: () => ({}),
  })),
}));

const PATH = "44'/144'/0'/0/0";

/** Replaces the kit-built signer with one whose device action emits `states`. */
const stubDeviceAction = (
  signer: DmkSignerXrp,
  method: "getAddress" | "signTransaction",
  observable: unknown,
): jest.Mock => {
  const mock = jest.fn().mockReturnValue({ observable });
  (signer as any).signer = { [method]: mock };
  return mock;
};

const errorState = (error: unknown) => of({ status: DeviceActionStatus.Error, error });

describe("DmkSignerXrp", () => {
  let signer: DmkSignerXrp;

  beforeEach(() => {
    jest.clearAllMocks();
    signer = new DmkSignerXrp({} as any, "sessionId");
  });

  describe("getAddress", () => {
    const completed = (output: unknown) =>
      of(
        { status: DeviceActionStatus.Pending, intermediateValue: {} },
        { status: DeviceActionStatus.Completed, output },
      );

    it("returns the public key, address and chain code the app answered with", async () => {
      const getAddress = stubDeviceAction(
        signer,
        "getAddress",
        completed({
          publicKey: "0324e5f600b52bb3d9246d49c4ab1722ba7f32b7a3e4f9f2b8a1a28b9118cc36c4",
          address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
          chainCode: "aa".repeat(32),
        }),
      );

      const result = await signer.getAddress(PATH, true, true);

      expect(getAddress).toHaveBeenCalledWith(PATH, {
        checkOnDevice: true,
        returnChainCode: true,
        skipOpenApp: true,
      });
      expect(result).toEqual({
        publicKey: "0324e5f600b52bb3d9246d49c4ab1722ba7f32b7a3e4f9f2b8a1a28b9118cc36c4",
        address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        chainCode: "aa".repeat(32),
      });
    });

    it("defaults display and chain code to off, and always opens the app itself", async () => {
      const getAddress = stubDeviceAction(
        signer,
        "getAddress",
        completed({ publicKey: "0324", address: "rHb9" }),
      );

      const result = await signer.getAddress(PATH);

      expect(getAddress).toHaveBeenCalledWith(PATH, {
        checkOnDevice: false,
        returnChainCode: false,
        skipOpenApp: true,
      });
      expect(result).toEqual({ publicKey: "0324", address: "rHb9", chainCode: undefined });
    });

    it("surfaces a locked device as LockedDeviceError", async () => {
      stubDeviceAction(
        signer,
        "getAddress",
        errorState({ _tag: "XrpAppCommandError", errorCode: "5515" }),
      );

      await expect(signer.getAddress(PATH)).rejects.toBeInstanceOf(LockedDeviceError);
    });

    it("surfaces an on-device rejection as UserRefusedOnDevice", async () => {
      stubDeviceAction(
        signer,
        "getAddress",
        errorState({ _tag: "XrpAppCommandError", errorCode: "6985" }),
      );

      await expect(signer.getAddress(PATH)).rejects.toBeInstanceOf(UserRefusedOnDevice);
    });

    it("refuses ed25519 rather than signing on the kit's secp256k1 curve", async () => {
      const getAddress = stubDeviceAction(signer, "getAddress", of());

      await expect(signer.getAddress(PATH, false, false, true)).rejects.toThrow(/ed25519/);
      expect(getAddress).not.toHaveBeenCalled();
    });
  });

  describe("signTransaction", () => {
    const signature = Uint8Array.from([0x30, 0x45, 0xde, 0xad, 0xbe, 0xef]);
    const completed = of({ status: DeviceActionStatus.Completed, output: signature });

    it("passes the blob through unchanged and hex-encodes the signature", async () => {
      const signTransaction = stubDeviceAction(signer, "signTransaction", completed);

      const result = await signer.signTransaction(PATH, "1200002280000000");

      expect(signTransaction).toHaveBeenCalledWith(
        PATH,
        Uint8Array.from([0x12, 0x00, 0x00, 0x22, 0x80, 0x00, 0x00, 0x00]),
        { skipOpenApp: true },
      );
      expect(result).toBe("3045deadbeef");
    });

    it("does not prepend the 53545800 signing prefix — the app adds it", async () => {
      const signTransaction = stubDeviceAction(signer, "signTransaction", completed);

      await signer.signTransaction(PATH, "1200");

      const [, blob] = signTransaction.mock.calls[0];
      expect(Array.from(blob as Uint8Array)).toEqual([0x12, 0x00]);
    });

    it("hands a blob larger than one APDU to the kit whole, for it to chunk", async () => {
      const signTransaction = stubDeviceAction(signer, "signTransaction", completed);
      const rawTxHex = "ab".repeat(600);

      await signer.signTransaction(PATH, rawTxHex);

      const [, blob] = signTransaction.mock.calls[0];
      expect((blob as Uint8Array).length).toBe(600);
    });

    it("surfaces a locked device as LockedDeviceError", async () => {
      stubDeviceAction(
        signer,
        "signTransaction",
        errorState({ _tag: "XrpAppCommandError", errorCode: "5515" }),
      );

      await expect(signer.signTransaction(PATH, "1200")).rejects.toBeInstanceOf(LockedDeviceError);
    });

    it.each(["6985", "6982"])("surfaces status word %s as UserRefusedOnDevice", async errorCode => {
      stubDeviceAction(
        signer,
        "signTransaction",
        errorState({ _tag: "XrpAppCommandError", errorCode }),
      );

      await expect(signer.signTransaction(PATH, "1200")).rejects.toBeInstanceOf(
        UserRefusedOnDevice,
      );
    });

    it("falls back to the error tag for an unmapped status word", async () => {
      stubDeviceAction(
        signer,
        "signTransaction",
        errorState({ _tag: "XrpAppCommandError", errorCode: "6a80" }),
      );

      await expect(signer.signTransaction(PATH, "1200")).rejects.toThrow("XrpAppCommandError");
    });

    it("falls back to the error tag for an error with no status word", async () => {
      stubDeviceAction(signer, "signTransaction", errorState({ _tag: "DeviceLockedError" }));

      await expect(signer.signTransaction(PATH, "1200")).rejects.toThrow("DeviceLockedError");
    });

    it("propagates a failure of the device action observable itself", async () => {
      stubDeviceAction(
        signer,
        "signTransaction",
        throwError(() => new Error("transport gone")),
      );

      await expect(signer.signTransaction(PATH, "1200")).rejects.toThrow("transport gone");
    });

    it("refuses ed25519 rather than signing on the kit's secp256k1 curve", async () => {
      const signTransaction = stubDeviceAction(signer, "signTransaction", of());

      await expect(signer.signTransaction(PATH, "1200", true)).rejects.toThrow(/ed25519/);
      expect(signTransaction).not.toHaveBeenCalled();
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

    it.each(nonTerminalStatuses)("rejects when signTransaction ends on %s", async status => {
      stubDeviceAction(signer, "signTransaction", of({ status }));

      await expect(signer.signTransaction(PATH, "1200")).rejects.toThrow(
        "Unknown device action status",
      );
    });

    it("rejects on a status the kit does not define", async () => {
      stubDeviceAction(signer, "signTransaction", of({ status: "somethingElse" }));

      await expect(signer.signTransaction(PATH, "1200")).rejects.toThrow(
        "Unknown device action status",
      );
    });
  });
});
