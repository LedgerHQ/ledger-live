import { of, throwError } from "rxjs";
import {
  DeviceActionStatus,
  UserInteractionRequired,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import { SignerZcashBuilder } from "@ledgerhq/device-signer-kit-zcash";
import { DmkSignerZcash } from "../src/DmkSignerZcash";
import type { PcztTransaction, SignerTransactionLike } from "../src/types";

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
    signPcztTransaction: jest.fn(),
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
        observable: createErrorStatusObservable({
          _tag: "ZcashAppCommandError",
          errorCode: "6985",
        }),
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

    it("sets serializedPreviousTransactionOverride from rawTxHex so the device hashes the full original transaction", async () => {
      // A V5 tx containing an Orchard bundle: serializeTransaction strips the
      // bundle and the device would hash truncated bytes, computing the wrong
      // ZIP-244 txid. rawTxHex carries the original bytes so the device gets the
      // full transaction via serializedPreviousTransactionOverride.
      const rawTxHex = "0500008001" + "ab".repeat(59);
      const prevTxWithRaw = { ...prevTx, rawTxHex };

      mockSignerZcash.signTransaction.mockReturnValue({
        observable: createCompletedObservable("00signed"),
      });

      await signer.createPaymentTransaction({
        ...baseArg,
        inputs: [[prevTxWithRaw, 0, null, 0xfffffffd, 2_000_000]] as Parameters<
          typeof signer.createPaymentTransaction
        >[0]["inputs"],
      });

      const [legacyArg] = mockSignerZcash.signTransaction.mock.calls[0];
      const legacyPrev = legacyArg.inputs[0][0];
      expect(legacyPrev.serializedPreviousTransactionOverride).toBeInstanceOf(Uint8Array);
      expect(Buffer.from(legacyPrev.serializedPreviousTransactionOverride).toString("hex")).toBe(
        rawTxHex,
      );
    });

    it("omits serializedPreviousTransactionOverride when rawTxHex is absent (plain transparent source tx)", async () => {
      // Source transactions without a shielded bundle are handled correctly by
      // serializeTransaction; no override is needed.
      mockSignerZcash.signTransaction.mockReturnValue({
        observable: createCompletedObservable("00signed"),
      });

      await signer.createPaymentTransaction(baseArg);

      const [legacyArg] = mockSignerZcash.signTransaction.mock.calls[0];
      const legacyPrev = legacyArg.inputs[0][0];
      expect(legacyPrev.serializedPreviousTransactionOverride).toBeUndefined();
    });

    const overrideOf = async (tx: SignerTransactionLike) => {
      mockSignerZcash.signTransaction.mockReturnValue({
        observable: createCompletedObservable("00signed"),
      });

      await signer.createPaymentTransaction({
        ...baseArg,
        inputs: [[tx, 0, null, 0xfffffffd, 2_000_000]] as Parameters<
          typeof signer.createPaymentTransaction
        >[0]["inputs"],
      });

      const [legacyArg] = mockSignerZcash.signTransaction.mock.calls[0];
      return legacyArg.inputs[0][0].serializedPreviousTransactionOverride;
    };

    it("omits the override for a V4 source transaction even when rawTxHex is available", async () => {
      // LIVE-35215: the V5 header layout the kit assumes would misplace the
      // input count of a V4 source and throw before any APDU is sent.
      const v4Prev = {
        ...prevTx,
        version: Buffer.from([0x04, 0x00, 0x00, 0x80]),
        rawTxHex: "0400008085202f89" + "ab".repeat(59),
      };

      await expect(overrideOf(v4Prev)).resolves.toBeUndefined();
    });

    it("keeps the override for a V5 source transaction", async () => {
      const v5Prev = { ...prevTx, rawTxHex: "0500008001" + "ab".repeat(59) };

      await expect(overrideOf(v5Prev)).resolves.toBeInstanceOf(Uint8Array);
    });

    it("decides the override per input, so a V4 source among V5 ones is the only one skipped", async () => {
      // The mix reported in LIVE-35215: two V5-funded inputs, then a V4 one.
      const firstV5 = { ...prevTx, rawTxHex: "0500008001" + "ab".repeat(59) };
      const secondV5 = { ...prevTx, rawTxHex: "0500008001" + "cd".repeat(59) };
      const v4 = {
        ...prevTx,
        version: Buffer.from([0x04, 0x00, 0x00, 0x80]),
        nVersionGroupId: Buffer.from([0x85, 0x20, 0x2f, 0x89]),
        rawTxHex: "0400008085202f89" + "ef".repeat(59),
      };

      mockSignerZcash.signTransaction.mockReturnValue({
        observable: createCompletedObservable("00signed"),
      });

      await signer.createPaymentTransaction({
        ...baseArg,
        inputs: [
          [firstV5, 0, null, 0xfffffffd, 2_000_000],
          [secondV5, 1, null, 0xfffffffd, 2_000_001],
          [v4, 0, null, 0xfffffffd, 2_000_002],
        ] as Parameters<typeof signer.createPaymentTransaction>[0]["inputs"],
        associatedKeysets: ["44'/133'/0'/0/0", "44'/133'/0'/0/1", "44'/133'/0'/0/2"],
      });

      const [legacyArg] = mockSignerZcash.signTransaction.mock.calls[0];
      const overrides = legacyArg.inputs.map(
        ([tx]: [{ serializedPreviousTransactionOverride?: Uint8Array }]) =>
          tx.serializedPreviousTransactionOverride,
      );

      expect(overrides[0]).toBeInstanceOf(Uint8Array);
      expect(overrides[1]).toBeInstanceOf(Uint8Array);
      expect(overrides[2]).toBeUndefined();
    });

    it("omits the override when the version field is too short to be read", async () => {
      // Defensive: a truncated version cannot be proven to be bundle-carrying,
      // so fall back to the path that works for every version.
      const shortVersion = {
        ...prevTx,
        version: Buffer.from([0x05, 0x00]),
        rawTxHex: "0500008001" + "ab".repeat(59),
      };

      await expect(overrideOf(shortVersion)).resolves.toBeUndefined();
    });
  });

  describe("signPcztTransaction", () => {
    const orchardSig = new Uint8Array(64).fill(0xab);
    const transparentSig = new Uint8Array(72).fill(0xcd);

    // Minimal valid-shaped PCZT — the mock doesn't inspect fields
    const minimalPczt: PcztTransaction = {
      global: {
        txVersion: 5,
        versionGroupId: 0x26a7270a,
        consensusBranchId: 0xc2d6d0b4,
        fallbackLockTime: null,
        expiryHeight: 0,
        coinType: 133,
        txModifiable: 0,
      },
      transparentInputs: [],
      transparentOutputs: [],
      orchardBundle: null,
    };

    it("returns orchard spendAuthSigs and empty transparentInputSigs for a pure-Orchard transaction", async () => {
      const result = { orchard: [{ spendAuthSig: orchardSig }], transparentInputSigs: [] };
      mockSignerZcash.signPcztTransaction.mockReturnValue({
        observable: createCompletedObservable(result),
      });

      expect(await signer.signPcztTransaction(minimalPczt)).toEqual(result);
      expect(mockSignerZcash.signPcztTransaction).toHaveBeenCalledWith(minimalPczt, {
        skipOpenApp: true,
      });
    });

    it("preserves spendAuthSig order: N actions return N signatures in action order", async () => {
      const sigs = [0x01, 0x02, 0x03].map(b => new Uint8Array(64).fill(b));
      const result = {
        orchard: sigs.map(spendAuthSig => ({ spendAuthSig })),
        transparentInputSigs: [],
      };
      mockSignerZcash.signPcztTransaction.mockReturnValue({
        observable: createCompletedObservable(result),
      });

      const out = await signer.signPcztTransaction(minimalPczt);

      expect(out.orchard).toHaveLength(3);
      out.orchard.forEach((sig, i) => {
        expect(sig.spendAuthSig[0]).toBe(i + 1);
      });
    });

    it("returns both orchard sigs and transparentInputSigs for a mixed transaction", async () => {
      const result = {
        orchard: [{ spendAuthSig: orchardSig }],
        transparentInputSigs: [transparentSig],
      };
      mockSignerZcash.signPcztTransaction.mockReturnValue({
        observable: createCompletedObservable(result),
      });

      const out = await signer.signPcztTransaction(minimalPczt);

      expect(out.orchard).toHaveLength(1);
      expect(out.transparentInputSigs).toHaveLength(1);
      expect(out.transparentInputSigs[0]).toBe(transparentSig);
    });

    it("rejects with UserRefusedOnDevice when the user declines on device (6985)", async () => {
      mockSignerZcash.signPcztTransaction.mockReturnValue({
        observable: createErrorStatusObservable({
          _tag: "ZcashAppCommandError",
          errorCode: "6985",
        }),
      });

      await expect(signer.signPcztTransaction(minimalPczt)).rejects.toMatchObject({
        name: "UserRefusedOnDevice",
      });
    });

    it("rejects with a mapped error when the device action returns error status", async () => {
      mockSignerZcash.signPcztTransaction.mockReturnValue({
        observable: createErrorStatusObservable({ _tag: "SignPcztTransactionDAError" }),
      });

      await expect(signer.signPcztTransaction(minimalPczt)).rejects.toThrow(
        "SignPcztTransactionDAError",
      );
    });

    it("rejects when the observable emits a transport error", async () => {
      mockSignerZcash.signPcztTransaction.mockReturnValue({
        observable: createTransportErrorObservable(new Error("transport down")),
      });

      await expect(signer.signPcztTransaction(minimalPczt)).rejects.toThrow("transport down");
    });

    it("rejects instead of hanging when the device action is stopped", async () => {
      mockSignerZcash.signPcztTransaction.mockReturnValue({
        observable: createStoppedObservable(),
      });

      await expect(signer.signPcztTransaction(minimalPczt)).rejects.toThrow(
        "Unexpected device action status: stopped",
      );
    });
  });

  describe("device action error mapping", () => {
    // LIVE-35215: an untagged task failure used to become `new Error(undefined)`,
    // reaching users and support logs as a message-less "Something went wrong".
    const untaggedErrorObservable = (error: unknown) =>
      of({ status: DeviceActionStatus.Error, error }) as ReturnType<
        typeof createErrorStatusObservable
      >;

    it("preserves the message of an untagged Error thrown inside a task", async () => {
      mockSignerZcash.getAddress.mockReturnValue({
        observable: untaggedErrorObservable(
          new RangeError("Offset is outside the bounds of the DataView"),
        ),
      });

      await expect(signer.getAddress("44'/133'/0'/0/0")).rejects.toThrow(
        "Offset is outside the bounds of the DataView",
      );
    });

    it("describes an untagged non-Error rejection instead of yielding an empty message", async () => {
      mockSignerZcash.getAddress.mockReturnValue({
        observable: untaggedErrorObservable({ reason: "split failed" }),
      });

      await expect(signer.getAddress("44'/133'/0'/0/0")).rejects.toThrow(
        'Untagged device action error: {"reason":"split failed"}',
      );
    });

    it.each([
      ["a string", "split failed", 'Untagged device action error: "split failed"'],
      ["null", null, "Untagged device action error: null"],
      ["undefined", undefined, "Untagged device action error: undefined"],
    ])(
      "describes %s rejection rather than throwing while inspecting it",
      async (_label, rejection, expected) => {
        mockSignerZcash.getAddress.mockReturnValue({
          observable: untaggedErrorObservable(rejection),
        });

        await expect(signer.getAddress("44'/133'/0'/0/0")).rejects.toThrow(expected);
      },
    );
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
