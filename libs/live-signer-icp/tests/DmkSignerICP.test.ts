/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { DmkSignerICP } from "../src/DmkSignerICP";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { of, throwError } from "rxjs";

jest.mock("@ledgerhq/device-signer-kit-icp", () => ({
  SignerIcpBuilder: jest.fn().mockImplementation(() => ({
    build: () => ({}),
  })),
}));

const DERIVATION_PATH = "44'/223'/0'/0/0";

describe("DmkSignerICP", () => {
  let signer: DmkSignerICP;
  const dmkMock = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
    signer = new DmkSignerICP(dmkMock, "sessionId");
  });

  describe("getAppConfiguration", () => {
    it("maps the device version on Completed status", async () => {
      const observable = of({
        status: DeviceActionStatus.Completed,
        output: { version: "2.3.1", testMode: false, locked: true },
      });
      (signer as any).signer = {
        getAppConfiguration: jest.fn().mockReturnValue({ observable }),
      };

      const result = await signer.getAppConfiguration();

      expect(result).toEqual({ version: "2.3.1", testMode: false, locked: true });
    });

    it("rejects with LockedDeviceError on error code 5515", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: { _tag: "GetVersionDAError", errorCode: "5515" },
      });
      (signer as any).signer = {
        getAppConfiguration: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAppConfiguration()).rejects.toThrow(LockedDeviceError);
    });

    it("throws on a non-terminal device action status", async () => {
      const observable = of({ status: DeviceActionStatus.Pending });
      (signer as any).signer = {
        getAppConfiguration: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAppConfiguration()).rejects.toThrow(
        "Unexpected device action status",
      );
    });
  });

  describe("getAddressAndPubKey", () => {
    it("maps the DMK address into the legacy response shape (no on-device check)", async () => {
      const output = {
        publicKey: "02".repeat(33),
        accountId: "0a".repeat(32),
        principal: "2vxsx-fae",
      };
      const observable = of({ status: DeviceActionStatus.Completed, output });
      const getAddress = jest.fn().mockReturnValue({ observable });
      (signer as any).signer = { getAddress };

      const result = await signer.getAddressAndPubKey(DERIVATION_PATH);

      expect(getAddress).toHaveBeenCalledWith(
        DERIVATION_PATH,
        expect.objectContaining({ checkOnDevice: false, skipOpenApp: true }),
      );
      expect(result).toEqual({
        returnCode: 0x9000,
        errorMessage: "",
        publicKey: Buffer.from(output.publicKey, "hex"),
        address: Buffer.from(output.accountId, "hex"),
        principalText: "2vxsx-fae",
      });
    });

    it("rejects with UserRefusedOnDevice on error code 6986", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: { _tag: "GetAddressDAError", errorCode: "6986" },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddressAndPubKey(DERIVATION_PATH)).rejects.toThrow(UserRefusedOnDevice);
    });

    it("rejects with a generic error on an unknown error code", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: { _tag: "GetAddressDAError", errorCode: "9999" },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddressAndPubKey(DERIVATION_PATH)).rejects.toThrow("GetAddressDAError");
    });

    it("rejects with the error tag when no errorCode is present", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: { _tag: "GetAddressDAError" },
      });
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddressAndPubKey(DERIVATION_PATH)).rejects.toThrow("GetAddressDAError");
    });

    it("rejects on observable error", async () => {
      const observable = throwError(() => new Error("transport error"));
      (signer as any).signer = {
        getAddress: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.getAddressAndPubKey(DERIVATION_PATH)).rejects.toThrow("transport error");
    });
  });

  describe("showAddressAndPubKey", () => {
    it("requests on-device confirmation", async () => {
      const output = {
        publicKey: "02".repeat(33),
        accountId: "0a".repeat(32),
        principal: "2vxsx-fae",
      };
      const observable = of({ status: DeviceActionStatus.Completed, output });
      const getAddress = jest.fn().mockReturnValue({ observable });
      (signer as any).signer = { getAddress };

      await signer.showAddressAndPubKey(DERIVATION_PATH);

      expect(getAddress).toHaveBeenCalledWith(
        DERIVATION_PATH,
        expect.objectContaining({ checkOnDevice: true, skipOpenApp: true }),
      );
    });
  });

  describe("sign", () => {
    it("concatenates r and s into a 64-byte signatureRS and keeps the DER", async () => {
      const output = {
        r: "aa".repeat(32),
        s: "bb".repeat(32),
        v: 1,
        der: "3006020101020101",
      };
      const observable = of({ status: DeviceActionStatus.Completed, output });
      const signTransaction = jest.fn().mockReturnValue({ observable });
      (signer as any).signer = { signTransaction };

      const message = Buffer.from("deadbeef", "hex");
      const result = await signer.sign(DERIVATION_PATH, message);

      expect(signTransaction).toHaveBeenCalledWith(
        DERIVATION_PATH,
        new Uint8Array(message),
        expect.objectContaining({ skipOpenApp: true }),
      );
      const signatureRS = Buffer.concat([
        Buffer.from(output.r, "hex"),
        Buffer.from(output.s, "hex"),
      ]);
      expect(signatureRS).toHaveLength(64);
      expect(result).toEqual({
        returnCode: 0x9000,
        signatureRS,
        signatureDER: Buffer.from(output.der, "hex"),
      });
    });

    it("forwards the stake flag to signTransaction", async () => {
      const output = { r: "aa".repeat(32), s: "bb".repeat(32), v: 1, der: "3006" };
      const observable = of({ status: DeviceActionStatus.Completed, output });
      const signTransaction = jest.fn().mockReturnValue({ observable });
      (signer as any).signer = { signTransaction };

      await signer.sign(DERIVATION_PATH, Buffer.from("tx"), true);

      expect(signTransaction).toHaveBeenCalledWith(
        DERIVATION_PATH,
        expect.any(Uint8Array),
        expect.objectContaining({ skipOpenApp: true, stake: true }),
      );
    });

    it("rejects with LockedDeviceError on error code 5515", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: { _tag: "SignTransactionDAError", errorCode: "5515" },
      });
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.sign(DERIVATION_PATH, Buffer.from("tx"))).rejects.toThrow(
        LockedDeviceError,
      );
    });

    it("rejects with UserRefusedOnDevice on error code 6986", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: { _tag: "SignTransactionDAError", errorCode: "6986" },
      });
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.sign(DERIVATION_PATH, Buffer.from("tx"))).rejects.toThrow(
        UserRefusedOnDevice,
      );
    });

    it("rejects on observable error", async () => {
      const observable = throwError(() => new Error("sign error"));
      (signer as any).signer = {
        signTransaction: jest.fn().mockReturnValue({ observable }),
      };

      await expect(signer.sign(DERIVATION_PATH, Buffer.from("tx"))).rejects.toThrow("sign error");
    });
  });

  describe("signUpdateCall", () => {
    const callRequest = Buffer.from("ca11", "hex");
    const readStateRequest = Buffer.from("5eed", "hex");

    it("maps both signatures to r‖s buffers and echoes the read-state body", async () => {
      const output = {
        requestHash: "11".repeat(32),
        requestSignature: { r: "aa".repeat(32), s: "bb".repeat(32) },
        readStateHash: "22".repeat(32),
        readStateSignature: { r: "cc".repeat(32), s: "dd".repeat(32) },
        readStateBody: new Uint8Array(readStateRequest),
      };
      const observable = of({ status: DeviceActionStatus.Completed, output });
      const signUpdateCall = jest.fn().mockReturnValue({ observable });
      (signer as any).signer = { signUpdateCall };

      const result = await signer.signUpdateCall(DERIVATION_PATH, callRequest, readStateRequest);

      expect(signUpdateCall).toHaveBeenCalledWith(
        DERIVATION_PATH,
        new Uint8Array(callRequest),
        new Uint8Array(readStateRequest),
        expect.objectContaining({ skipOpenApp: true }),
      );
      expect(result).toEqual({
        returnCode: 0x9000,
        requestHash: Buffer.from(output.requestHash, "hex"),
        requestSignatureRS: Buffer.concat([
          Buffer.from(output.requestSignature.r, "hex"),
          Buffer.from(output.requestSignature.s, "hex"),
        ]),
        readStateHash: Buffer.from(output.readStateHash, "hex"),
        readStateSignatureRS: Buffer.concat([
          Buffer.from(output.readStateSignature.r, "hex"),
          Buffer.from(output.readStateSignature.s, "hex"),
        ]),
        readStateBody: readStateRequest,
      });
      expect(result.requestSignatureRS).toHaveLength(64);
      expect(result.readStateSignatureRS).toHaveLength(64);
    });

    it("rejects with UserRefusedOnDevice on error code 6986", async () => {
      const observable = of({
        status: DeviceActionStatus.Error,
        error: { _tag: "SignUpdateCallDAError", errorCode: "6986" },
      });
      (signer as any).signer = {
        signUpdateCall: jest.fn().mockReturnValue({ observable }),
      };

      await expect(
        signer.signUpdateCall(DERIVATION_PATH, callRequest, readStateRequest),
      ).rejects.toThrow(UserRefusedOnDevice);
    });

    it("rejects on observable error", async () => {
      const observable = throwError(() => new Error("update-call error"));
      (signer as any).signer = {
        signUpdateCall: jest.fn().mockReturnValue({ observable }),
      };

      await expect(
        signer.signUpdateCall(DERIVATION_PATH, callRequest, readStateRequest),
      ).rejects.toThrow("update-call error");
    });
  });
});
