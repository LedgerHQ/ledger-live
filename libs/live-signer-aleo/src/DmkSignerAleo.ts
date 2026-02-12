import type { AleoSigner } from "@ledgerhq/coin-aleo/types/signer";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";

type DAError = Error;

export class DmkSignerAleo implements AleoSigner {
  private readonly dmk: DeviceManagementKit;
  private readonly sessionId: string;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.dmk = dmk;
    this.sessionId = sessionId;
  }

  private _mapError<E extends DAError>(error: E): Error {
    if (!("_tag" in error) || typeof error._tag !== "string") {
      return new Error("Unknown error");
    }

    if (!("errorCode" in error)) {
      return new Error(error._tag);
    }

    switch (error.errorCode) {
      case "5515":
        return new LockedDeviceError();
      case "6985":
        return new UserRefusedOnDevice();
      default:
        return new Error(error._tag);
    }
  }

  private _serializePath(derivationPath: string): Buffer {
    const pathElements = derivationPath
      .split("/")
      .filter(segment => segment !== "")
      .map(segment => {
        const isHardened = segment.endsWith("'");
        const value = Number.parseInt(isHardened ? segment.slice(0, -1) : segment, 10);
        return isHardened ? (value + 0x80000000) >>> 0 : value;
      });

    if (pathElements.length === 0) {
      throw new Error("Derivation path must contain at least one element.");
    }

    const buffer = Buffer.alloc(1 + pathElements.length * 4);
    buffer.writeUInt8(pathElements.length, 0);

    pathElements.forEach((element, index) => {
      buffer.writeUInt32BE(element, 1 + index * 4);
    });

    return buffer;
  }

  private async _sendApdu(apdu: Buffer): Promise<Buffer> {
    const response = await this.dmk
      .sendApdu({ sessionId: this.sessionId, apdu })
      .then(apduResponse => Buffer.from([...apduResponse.data, ...apduResponse.statusCode]))
      .catch(error => {
        throw this._mapError(error);
      });

    return response.slice(0, -2);
  }

  async getAddress(path: string, display?: boolean): Promise<Buffer> {
    const CLA = 0xe0;
    const GET_PUBLIC_KEY = 0x05;
    const p1 = display ? 0x01 : 0x00;
    const p2 = 0x00;
    const pathBuffer = this._serializePath(path);
    const apdu = Buffer.concat([
      Buffer.from([CLA, GET_PUBLIC_KEY, p1, p2]),
      Buffer.from([pathBuffer.length]),
      pathBuffer,
    ]);

    const response = await this._sendApdu(apdu);

    // Skip the first byte (length) and return the actual address
    return response.slice(1);
  }

  async getViewKey(path: string): Promise<Buffer> {
    const CLA = 0xe0;
    const GET_VIEW_KEY = 0x07;
    const p1 = 0x01;
    const p2 = 0x00;
    const pathBuffer = this._serializePath(path);
    const apdu = Buffer.concat([
      Buffer.from([CLA, GET_VIEW_KEY, p1, p2]),
      Buffer.from([pathBuffer.length]),
      pathBuffer,
    ]);

    const response = await this._sendApdu(apdu);

    // Skip the first byte (length) and return the actual address
    return response.slice(1);
  }

  async signTransaction(_path: string, _transaction: Buffer): Promise<Buffer> {
    throw new Error("Not implemented yet");
  }
}
