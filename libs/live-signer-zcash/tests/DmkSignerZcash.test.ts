import { of, throwError } from "rxjs";
import {
  DeviceActionStatus,
  UserInteractionRequired,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
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
    signTransaction: jest.fn(),
  };

  let signer: DmkSignerZcash;
  let buildMock: jest.Mock;

  // Real RxJS observables that emit then complete, mirroring how DMK device
  // actions stream states before completing the stream. The signer consumes
  // them via `lastValueFrom`, which relies on the observable completing.
  const createCompletedObservable = <T>(output: T) =>
    of({ status: DeviceActionStatus.Completed, output });

  const createErrorStatusObservable = <E extends { _tag: string }>(error: E) =>
    of({ status: DeviceActionStatus.Error, error });

  const createTransportErrorObservable = (error: Error) => throwError(() => error);

  // A terminal `Stopped` state followed by completion — DMK signals an aborted
  // action this way, and the signer must reject rather than hang.
  const createStoppedObservable = () => of({ status: DeviceActionStatus.Stopped });

  // Emits the device action's intermediate states in order, then completes —
  // mirroring how the DMK signTransaction action streams `Pending` states
  // (carrying `requiredUserInteraction`) before the final signed output.
  const createSigningObservable = <T>(
    states: Array<{ status: DeviceActionStatus.Pending; intermediateValue: unknown }>,
    output: T,
  ) => of(...states, { status: DeviceActionStatus.Completed, output });

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

    it("should reject instead of hanging when the device action is stopped", async () => {
      mockSignerZcash.getAddress.mockReturnValue({
        observable: createStoppedObservable(),
      });

      await expect(signer.getAddress("44'/133'/0'/0/0")).rejects.toThrow(
        "Unexpected device action status: stopped",
      );
    });

    it("rejects with UserRefusedOnDevice (drives the 'Action rejected' UI) on the 6985 status word", async () => {
      mockSignerZcash.getAddress.mockReturnValue({
        observable: createErrorStatusObservable({ _tag: "ZcashAppCommandError", errorCode: "6985" }),
      });

      await expect(signer.getAddress("44'/133'/0'/0/0")).rejects.toMatchObject({
        name: "UserRefusedOnDevice",
      });
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

  describe("createPaymentTransaction", () => {
    const prevTx = {
      version: Buffer.from([0x05, 0x00, 0x00, 0x80]),
      inputs: [
        {
          prevout: Buffer.alloc(36, 0x11),
          script: Buffer.from([0x76, 0xa9]),
          sequence: Buffer.from([0xff, 0xff, 0xff, 0xff]),
        },
      ],
      outputs: [{ amount: Buffer.alloc(8, 0x00), script: Buffer.from([0x76, 0xa9, 0x14]) }],
      locktime: Buffer.from([0x00, 0x00, 0x00, 0x00]),
      nVersionGroupId: Buffer.from([0x0a, 0x27, 0xa7, 0x26]),
      nExpiryHeight: Buffer.from([0x00, 0x00, 0x00, 0x00]),
    };

    const baseArg = {
      inputs: [[prevTx, 0, null, 0xfffffffd, 2_000_000]] as [
        typeof prevTx,
        number,
        string | null,
        number,
        number,
      ][],
      associatedKeysets: ["44'/133'/0'/0/0"],
      changePath: "44'/133'/0'/1/0",
      outputScriptHex: "0123abcd",
      lockTime: 0,
      blockHeight: 2_010_000,
      sigHashType: 1,
      additionals: ["zcash", "sapling"],
      expiryHeight: Buffer.from([0x10, 0x00, 0x00, 0x00]),
    };

    it("maps a CreateTransaction to the DMK LegacyCreateTransactionArg and returns the signed-tx hex", async () => {
      mockSignerZcash.signTransaction.mockReturnValue({
        observable: createCompletedObservable("0500008001abcdsignedtx"),
      });

      const result = await signer.createPaymentTransaction(baseArg);

      expect(result).toBe("0500008001abcdsignedtx");
      expect(mockSignerZcash.signTransaction).toHaveBeenCalledTimes(1);

      const [legacyArg, options] = mockSignerZcash.signTransaction.mock.calls[0];
      expect(options).toEqual({ skipOpenApp: true });

      // Scalar fields copied verbatim
      expect(legacyArg.associatedKeysets).toEqual(["44'/133'/0'/0/0"]);
      expect(legacyArg.changePath).toBe("44'/133'/0'/1/0");
      expect(legacyArg.outputScriptHex).toBe("0123abcd");
      expect(legacyArg.lockTime).toBe(0);
      expect(legacyArg.blockHeight).toBe(2_010_000);
      expect(legacyArg.sigHashType).toBe(1);
      expect(legacyArg.additionals).toEqual(["zcash", "sapling"]);
      expect(legacyArg.expiryHeight).toBeInstanceOf(Uint8Array);
      expect(Buffer.from(legacyArg.expiryHeight).toString("hex")).toBe("10000000");

      // Per-input tuple: outputIndex, script, sequence preserved; 5th element
      // (block height) passed through unchanged — DMK derives the branch id from it.
      const input = legacyArg.inputs[0];
      expect(input[1]).toBe(0);
      expect(input[2]).toBeNull();
      expect(input[3]).toBe(0xfffffffd);
      expect(input[4]).toBe(2_000_000);

      // Prev-tx converted to LegacyTransaction with Uint8Array fields
      const legacyPrev = input[0];
      expect(legacyPrev.version).toBeInstanceOf(Uint8Array);
      expect(Buffer.from(legacyPrev.version).toString("hex")).toBe("05000080");
      expect(legacyPrev.inputs).toHaveLength(1);
      expect(Buffer.from(legacyPrev.inputs[0].prevout).toString("hex")).toBe("11".repeat(36));
      expect(legacyPrev.outputs).toHaveLength(1);
      expect(Buffer.from(legacyPrev.outputs[0].script).toString("hex")).toBe("76a914");
    });

    it("strips the 0x prefix from the device output for broadcast compatibility", async () => {
      mockSignerZcash.signTransaction.mockReturnValue({
        observable: createCompletedObservable("0x0500008001deadbeef"),
      });

      const result = await signer.createPaymentTransaction(baseArg);

      expect(result).toBe("0500008001deadbeef");
    });

    it("maps multiple inputs preserving order and per-input fields", async () => {
      mockSignerZcash.signTransaction.mockReturnValue({
        observable: createCompletedObservable("00signed"),
      });

      const secondPrev = { ...prevTx, version: Buffer.from([0x04, 0x00, 0x00, 0x80]) };
      await signer.createPaymentTransaction({
        ...baseArg,
        inputs: [
          [prevTx, 0, null, 0xfffffffd, 2_000_000],
          [secondPrev, 3, null, 0xffffffff, 2_000_100],
        ] as [typeof prevTx, number, string | null, number, number][],
        associatedKeysets: ["44'/133'/0'/0/0", "44'/133'/0'/0/1"],
      });

      const [legacyArg] = mockSignerZcash.signTransaction.mock.calls[0];
      expect(legacyArg.inputs).toHaveLength(2);
      expect(legacyArg.inputs[1][1]).toBe(3);
      expect(legacyArg.inputs[1][4]).toBe(2_000_100);
      expect(Buffer.from(legacyArg.inputs[1][0].version).toString("hex")).toBe("04000080");
      expect(legacyArg.associatedKeysets).toEqual(["44'/133'/0'/0/0", "44'/133'/0'/0/1"]);
    });

    it("rejects with a mapped error when the device action returns error status", async () => {
      mockSignerZcash.signTransaction.mockReturnValue({
        observable: createErrorStatusObservable({ _tag: "SignTransactionDAError" }),
      });

      await expect(signer.createPaymentTransaction(baseArg)).rejects.toThrow(
        "SignTransactionDAError",
      );
    });

    it("rejects when the observable emits a transport error", async () => {
      mockSignerZcash.signTransaction.mockReturnValue({
        observable: createTransportErrorObservable(new Error("transport down")),
      });

      await expect(signer.createPaymentTransaction(baseArg)).rejects.toThrow("transport down");
    });

    it("rejects instead of hanging when the device action is stopped", async () => {
      mockSignerZcash.signTransaction.mockReturnValue({
        observable: createStoppedObservable(),
      });

      await expect(signer.createPaymentTransaction(baseArg)).rejects.toThrow(
        "Unexpected device action status: stopped",
      );
    });

    it("rejects with UserRefusedOnDevice (drives the 'Action rejected' UI) when the user declines signing", async () => {
      mockSignerZcash.signTransaction.mockReturnValue({
        observable: createErrorStatusObservable({
          _tag: "ZcashAppCommandError",
          errorCode: "6985",
        }),
      });

      await expect(signer.createPaymentTransaction(baseArg)).rejects.toMatchObject({
        name: "UserRefusedOnDevice",
      });
    });

    it("fires device-signing callbacks so Ledger Live can show the on-device UI", async () => {
      mockSignerZcash.signTransaction.mockReturnValue({
        observable: createSigningObservable(
          [
            {
              status: DeviceActionStatus.Pending,
              intermediateValue: {
                requiredUserInteraction: UserInteractionRequired.SignTransaction,
              },
            },
          ],
          "00signed",
        ),
      });

      const onDeviceSignatureRequested = jest.fn();
      const onDeviceSignatureGranted = jest.fn();

      const result = await signer.createPaymentTransaction({
        ...baseArg,
        onDeviceSignatureRequested,
        onDeviceSignatureGranted,
      });

      expect(result).toBe("00signed");
      // Requested proactively (the DMK intermediate state is lost to the intent queue),
      // granted on the terminal Completed state.
      expect(onDeviceSignatureRequested).toHaveBeenCalledTimes(1);
      expect(onDeviceSignatureGranted).toHaveBeenCalledTimes(1);
    });

    it("requests the signature exactly once and before the action completes", async () => {
      const callOrder: string[] = [];
      mockSignerZcash.signTransaction.mockReturnValue({
        observable: createSigningObservable([], "00signed"),
      });

      const onDeviceSignatureRequested = jest.fn(() => callOrder.push("requested"));
      const onDeviceSignatureGranted = jest.fn(() => callOrder.push("granted"));

      await signer.createPaymentTransaction({
        ...baseArg,
        onDeviceSignatureRequested,
        onDeviceSignatureGranted,
      });

      expect(onDeviceSignatureRequested).toHaveBeenCalledTimes(1);
      expect(callOrder).toEqual(["requested", "granted"]);
    });

    it("does not throw when the device-signing callbacks are omitted", async () => {
      mockSignerZcash.signTransaction.mockReturnValue({
        observable: createSigningObservable(
          [
            {
              status: DeviceActionStatus.Pending,
              intermediateValue: {
                requiredUserInteraction: UserInteractionRequired.SignTransaction,
              },
            },
          ],
          "00signed",
        ),
      });

      await expect(signer.createPaymentTransaction(baseArg)).resolves.toBe("00signed");
    });
  });

  describe("not implemented methods", () => {
    it("should throw for getAppConfig", async () => {
      await expect(signer.getAppConfig()).rejects.toThrow("Not implemented");
    });

    it("should throw for getTrustedInput", async () => {
      await expect(signer.getTrustedInput()).rejects.toThrow("Not implemented");
    });

    it("should throw for signMessage", async () => {
      await expect(signer.signMessage("44'/133'/0'/0/0", "deadbeef")).rejects.toThrow(
        "Not implemented",
      );
    });
  });
});
