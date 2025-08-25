import type Transport from "@ledgerhq/hw-transport";
import { UserRefusedAddress, UserRefusedOnDevice } from "@ledgerhq/errors";
import { CantonAddress, CantonSignature } from "@ledgerhq/coin-canton";
import BIPPath from "bip32-path";

import { MockCantonDevice, AppConfig } from "./MockDevice";

const CLA = 0xe0;

const P1_NON_CONFIRM = 0x00;
const P1_CONFIRM = 0x01;

const P2 = 0x00;

const INS = {
  GET_VERSION: 0x03,
  GET_APP_NAME: 0x04,
  GET_ADDR: 0x05,
  SIGN: 0x06,
};

const STATUS = {
  OK: 0x9000,
  USER_CANCEL: 0x6985,
};

/**
 * Canton BOLOS API
 */
export default class Canton {
  transport: Transport;
  transportMock: MockCantonDevice;

  constructor(transport: Transport, scrambleKey = "canton_default_scramble_key") {
    this.transport = transport;
    this.transportMock = new MockCantonDevice();

    transport.decorateAppAPIMethods(
      this,
      ["getAddress", "signTransaction", "getAppConfiguration"],
      scrambleKey,
    );
  }

  /**
   * Get a Canton address for a given BIP-32 path.
   *
   * @param path a path in BIP-32 format
   * @param display whether to display the address on the device
   * @return the address and public key
   */
  async getAddress(path: string, display: boolean = false): Promise<CantonAddress> {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const serializedPath = this.serializePath(bipPath);

    const p1 = display ? P1_CONFIRM : P1_NON_CONFIRM;
    const response = await this.transport.send(CLA, INS.GET_ADDR, p1, P2, serializedPath);

    const responseData = this.handleTransportResponse(response, "address");
    const { pubKey } = this.extractPubkeyAndChainCode(responseData);

    // Handle 65-byte uncompressed SECP256R1 public key
    const publicKey = "0x" + pubKey;

    const addressHash = this.hashString(publicKey);
    const address = "canton_" + addressHash.substring(0, 36);

    return {
      publicKey,
      address,
    };
  }

  /**
   * Sign a Canton transaction.
   *
   * @param path a path in BIP-32 format
   * @param rawTx the raw transaction to sign
   * @return the signature
   */
  async signTransaction(path: string, rawTx: string): Promise<CantonSignature> {
    const bipPath = BIPPath.fromString(path).toPathArray();
    const serializedPath = this.serializePath(bipPath);
    const payload = Buffer.concat([serializedPath, Buffer.from(rawTx, "hex")]);

    const response = await this.transportMock.send(CLA, INS.SIGN, P1_CONFIRM, P2, payload);

    const responseData = this.handleTransportResponse(response, "transaction");

    const signature = "0x" + responseData.toString("hex");
    return signature;
  }

  /**
   * Get the app configuration.
   * @return the app configuration including version
   */
  async getAppConfiguration(): Promise<AppConfig> {
    const response = await this.transport.send(
      CLA,
      INS.GET_VERSION,
      P1_NON_CONFIRM,
      P2,
      Buffer.alloc(0),
    );

    const responseData = this.handleTransportResponse(response, "version");
    const { major, minor, patch } = this.extractVersion(responseData);

    return {
      version: `${major}.${minor}.${patch}`,
    };
  }

  /**
   * Helper method to handle transport response and check for errors
   * @private
   */
  private handleTransportResponse(
    response: Buffer,
    errorType: "address" | "transaction" | "version",
  ): Buffer {
    const statusCode = response.readUInt16BE(response.length - 2);
    const responseData = response.slice(0, response.length - 2);

    if (statusCode === STATUS.USER_CANCEL) {
      switch (errorType) {
        case "address":
          throw new UserRefusedAddress();
        case "transaction":
          throw new UserRefusedOnDevice();
        default:
          throw new Error();
      }
    }

    return responseData;
  }

  /**
   * Serialize a BIP path to a data buffer for Canton BOLOS
   * @private
   */
  private serializePath(path: number[]): Buffer {
    const data = Buffer.alloc(1 + path.length * 4);

    data.writeUInt8(path.length, 0); // Write path length as first byte
    path.forEach((segment, index) => {
      data.writeUInt32BE(segment, 1 + index * 4); // Write each segment as 32-bit integer
    });

    return data;
  }

  /**
   * Simple deterministic hash function for generating mock addresses
   * @private
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Extract Pubkey info from APDU response
   * @private
   */
  private extractPubkeyAndChainCode(data: Buffer): { pubKey: string; chainCode: string } {
    const pubkeySize = parseInt(data.subarray(0, 1).toString("hex"), 16);
    const pubKey = data.subarray(1, pubkeySize + 1);

    const chainCodeSize = parseInt(
      data.subarray(pubkeySize + 1, pubkeySize + 2).toString("hex"),
      16,
    );
    const chainCode = data.subarray(pubkeySize + 2, pubkeySize + chainCodeSize + 2);
    return { pubKey: pubKey.toString("hex"), chainCode: chainCode.toString("hex") };
  }

  /**
   * Extract AppVersion from APDU response
   * @private
   */
  private extractVersion(data: Buffer): { major: number; minor: number; patch: number } {
    return {
      major: parseInt(data.subarray(0, 1).toString("hex"), 16),
      minor: parseInt(data.subarray(1, 2).toString("hex"), 16),
      patch: parseInt(data.subarray(2, 3).toString("hex"), 16),
    };
  }
}
