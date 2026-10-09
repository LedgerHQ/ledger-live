import {
  ApduResponse,
  InvalidStatusWordError,
  isSuccessCommandResult,
  type CommandResult,
} from "@ledgerhq/device-management-kit";
import { GetAppConfigCommand } from "../../src/kit/GetAppConfigCommand";
import { GetPublicKeyCommand } from "../../src/kit/GetPublicKeyCommand";
import { HederaAppCommandError } from "../../src/kit/HederaAppErrors";
import { SignTransactionCommand } from "../../src/kit/SignTransactionCommand";

const response = (data: number[], sw: [number, number] = [0x90, 0x00]) =>
  new ApduResponse({ data: Uint8Array.from(data), statusCode: Uint8Array.from(sw) });

const errorOf = <T, E>(result: CommandResult<T, E>) => {
  if (isSuccessCommandResult(result)) throw new Error("expected an error result");
  return result.error;
};

const dataOf = <T, E>(result: CommandResult<T, E>) => {
  if (!isSuccessCommandResult(result)) throw new Error("expected a success result");
  return result.data;
};

describe("GetPublicKeyCommand", () => {
  it("should send the key index as 4 little-endian bytes in silent mode", () => {
    const apdu = new GetPublicKeyCommand({ keyIndex: 0x01020304, checkOnDevice: false })
      .getApdu()
      .getRawApdu();

    expect(Array.from(apdu)).toEqual([0xe0, 0x02, 0x01, 0x00, 0x04, 0x04, 0x03, 0x02, 0x01]);
  });

  it("should ask for on-device confirmation with P1 = 0x00", () => {
    const apdu = new GetPublicKeyCommand({ keyIndex: 0, checkOnDevice: true })
      .getApdu()
      .getRawApdu();

    expect(Array.from(apdu)).toEqual([0xe0, 0x02, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00]);
  });

  it("should return the 32-byte public key as hex", () => {
    const key = Array.from({ length: 32 }, (_, i) => i);

    const result = new GetPublicKeyCommand({ keyIndex: 0, checkOnDevice: false }).parseResponse(
      response(key),
    );

    expect(dataOf(result)).toBe(Buffer.from(key).toString("hex"));
  });

  it("should fail when the response is shorter than a public key", () => {
    const result = new GetPublicKeyCommand({ keyIndex: 0, checkOnDevice: false }).parseResponse(
      response([1, 2, 3]),
    );

    expect(errorOf(result)).toBeInstanceOf(InvalidStatusWordError);
  });

  it("should map 0x6985 to a Hedera app error", () => {
    const result = new GetPublicKeyCommand({ keyIndex: 0, checkOnDevice: true }).parseResponse(
      response([], [0x69, 0x85]),
    );

    const error = errorOf(result);
    expect(error).toBeInstanceOf(HederaAppCommandError);
    expect(error).toMatchObject({ errorCode: "6985" });
  });

  it("should defer to the global handler for a locked device", () => {
    const result = new GetPublicKeyCommand({ keyIndex: 0, checkOnDevice: false }).parseResponse(
      response([], [0x55, 0x15]),
    );

    expect(errorOf(result)).toMatchObject({ _tag: "DeviceLockedError", errorCode: "5515" });
  });
});

describe("SignTransactionCommand", () => {
  const body = Uint8Array.from([0x0a, 0x0b, 0x0c]);

  it("should prefix the transaction body with the little-endian key index", () => {
    const apdu = new SignTransactionCommand({ keyIndex: 0, transactionBody: body })
      .getApdu()
      .getRawApdu();

    expect(Array.from(apdu)).toEqual([
      0xe0, 0x04, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x0a, 0x0b, 0x0c,
    ]);
  });

  it("should throw rather than send a truncated APDU when the body does not fit", () => {
    const command = new SignTransactionCommand({
      keyIndex: 0,
      transactionBody: new Uint8Array(252),
    });

    expect(() => command.getApdu()).toThrow("Invalid Hedera APDU");
  });

  it("should return the 64-byte signature", () => {
    const signature = Array.from({ length: 64 }, (_, i) => i);

    const result = new SignTransactionCommand({ keyIndex: 0, transactionBody: body }).parseResponse(
      response(signature),
    );

    expect(dataOf(result)).toEqual(Uint8Array.from(signature));
  });

  it("should fail on a signature of the wrong length", () => {
    const result = new SignTransactionCommand({ keyIndex: 0, transactionBody: body }).parseResponse(
      response(new Array(63).fill(1)),
    );

    expect(errorOf(result)).toBeInstanceOf(InvalidStatusWordError);
  });

  it("should map a user rejection to a Hedera app error", () => {
    const result = new SignTransactionCommand({ keyIndex: 0, transactionBody: body }).parseResponse(
      response([], [0x69, 0x85]),
    );

    expect(errorOf(result)).toMatchObject({ errorCode: "6985" });
  });
});

describe("GetAppConfigCommand", () => {
  it("should send an empty GET_APP_CONFIGURATION APDU", () => {
    const apdu = new GetAppConfigCommand().getApdu().getRawApdu();

    expect(Array.from(apdu)).toEqual([0xe0, 0x01, 0x00, 0x00, 0x00]);
  });

  it("should parse the storage flag and version", () => {
    const result = new GetAppConfigCommand().parseResponse(response([0, 1, 9, 2]));

    expect(dataOf(result)).toEqual({ storageAllowed: false, version: "1.9.2" });
  });

  it("should map an unsupported instruction to a Hedera app error", () => {
    const result = new GetAppConfigCommand().parseResponse(response([], [0x6d, 0x00]));

    const error = errorOf(result);
    expect(error).toBeInstanceOf(HederaAppCommandError);
    expect(error).toMatchObject({ errorCode: "6d00" });
  });

  it("should fail on a truncated configuration", () => {
    const result = new GetAppConfigCommand().parseResponse(response([0, 1]));

    expect(errorOf(result)).toBeInstanceOf(InvalidStatusWordError);
  });
});
