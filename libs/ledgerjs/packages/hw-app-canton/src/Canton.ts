import type Transport from "@ledgerhq/hw-transport";
import { UserRefusedAddress, UserRefusedOnDevice } from "@ledgerhq/errors";
import BIPPath from "bip32-path";

const CLA = 0xe0;

const P1_NON_CONFIRM = 0x00;
const P1_CONFIRM = 0x01;

// P2 indicating no information.
const P2_NONE = 0x00;
// P2 indicating first APDU in a large request.
const P2_FIRST = 0x01;
// P2 indicating that this is not the last APDU in a large request.
const P2_MORE = 0x02;
// P2 indicating that this is the last APDU of a message in a multi message request.
const P2_MSG_END = 0x04;

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

const ED25519_SIGNATURE_HEX_LENGTH = 128; // hex characters (64 bytes)
const CANTON_SIGNATURE_HEX_LENGTH = 130; // hex characters (65 bytes with framing)

export type AppConfig = {
  version: string;
};

export type CantonAddress = {
  publicKey: string;
  address: string;
};

export type CantonSignature = string;

/**
 * Canton BOLOS API
 */
export default class Canton {
  transport: Transport;

  constructor(transport: Transport, scrambleKey = "canton_default_scramble_key") {
    this.transport = transport;

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
    const response = await this.transport.send(CLA, INS.GET_ADDR, p1, P2_NONE, serializedPath);

    const responseData = this.handleTransportResponse(response, "address");
    const { pubKey } = this.extractPubkeyAndChainCode(responseData);

    const publicKey = "0x" + pubKey;
    const addressHash = this.hashString(publicKey);
    const address = "canton_" + addressHash.substring(0, 36);

    return {
      publicKey: pubKey,
      address,
    };
  }

  /**
   * Sign a Canton transaction.
   *
   * @param path a path in BIP-32 format
   * @param txHash the transaction hash to sign
   * @return the signature
   */
  async signTransaction(path: string, txHash: string): Promise<CantonSignature> {
    // 1. Send the derivation path
    const bipPath = BIPPath.fromString(path).toPathArray();
    const serializedPath = this.serializePath(bipPath);

    const pathResponse = await this.transport.send(
      CLA,
      INS.SIGN,
      P1_NON_CONFIRM,
      P2_FIRST | P2_MORE,
      serializedPath,
    );

    this.handleTransportResponse(pathResponse, "transaction");

    // 2. Send the transaction hash
    const response = await this.transport.send(
      CLA,
      INS.SIGN,
      P1_NON_CONFIRM,
      P2_MSG_END,
      Buffer.from(txHash, "hex"),
    );

    const responseData = this.handleTransportResponse(response, "transaction");
    const rawSignature = responseData.toString("hex");

    return this.cleanSignatureFormat(rawSignature);
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
      P2_NONE,
      Buffer.alloc(0),
    );

    const responseData = this.handleTransportResponse(response, "version");
    const { major, minor, patch } = this.extractVersion(responseData);

    return {
      version: `${major}.${minor}.${patch}`,
    };
  }

  /**
   * Converts 65-byte Canton format to 64-byte Ed25519:
   * [40][64_bytes_signature][00] (130 hex chars)
   * @private
   */
  private cleanSignatureFormat(signature: string): CantonSignature {
    if (signature.length === ED25519_SIGNATURE_HEX_LENGTH) {
      return signature;
    }

    if (signature.length === CANTON_SIGNATURE_HEX_LENGTH) {
      const cleanedSignature = signature.slice(2, -2);
      return cleanedSignature;
    }

    console.warn(`[Canton]: Unknown signature format (${signature.length} chars)`);
    return signature;
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
    // Parse the response according to the Python unpack_get_addr_response format:
    // response = pubkey_len (1) + pubkey (var) + chaincode_len (1) + chaincode (var)

    let offset = 0;

    // Extract public key length (1 byte)
    const pubkeySize = data.readUInt8(offset);
    offset += 1;

    // Extract public key
    const pubKey = data.subarray(offset, offset + pubkeySize);
    offset += pubkeySize;

    // Extract chain code length (1 byte)
    const chainCodeSize = data.readUInt8(offset);
    offset += 1;

    // Extract chain code
    const chainCode = data.subarray(offset, offset + chainCodeSize);

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
