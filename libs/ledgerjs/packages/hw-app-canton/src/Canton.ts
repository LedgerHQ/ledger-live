import { TransportStatusError } from "@ledgerhq/errors";
import type Transport from "@ledgerhq/hw-transport";
import BIPPath from "bip32-path";

export type * from "./types";

export const CLA = 0xe0;

export const P1_NON_CONFIRM = 0x00;
export const P1_CONFIRM = 0x01;
export const P1_SIGN_UNTYPED_VERSIONED_MESSAGE = 0x01;
export const P1_SIGN_PREPARED_TRANSACTION = 0x02;

export const P2_NONE = 0x00;
export const P2_FIRST = 0x01;
export const P2_MORE = 0x02;
export const P2_MSG_END = 0x04;

export const INS = {
  GET_VERSION: 0x03,
  GET_APP_NAME: 0x04,
  GET_ADDR: 0x05,
  SIGN: 0x06,
};

export const STATUS = {
  OK: 0x9000,
  USER_CANCEL: 0x6985,
};

export const SIGNATURE_FRAMING_BYTE = 0x40;
export const SIGNATURE_END_BYTE = 0x00;

const ED25519_SIGNATURE_HEX_LENGTH = 128; // hex characters (64 bytes)
const CANTON_SIGNATURE_HEX_LENGTH = 132; // hex characters (66 bytes with framing)
const MAX_APDU_DATA_LENGTH = 255;

export type AppConfig = {
  version: string;
};

export type CantonAddress = {
  publicKey: string;
  address: string;
  path: string;
};

export type CantonSignature = {
  signature: string;
  applicationSignature?: string;
};

export type CantonPreparedTransaction = {
  damlTransaction: Uint8Array;
  nodes: Uint8Array[];
  metadata: Uint8Array;
  inputContracts: Uint8Array[];
};

export type CantonUntypedVersionedMessage = {
  transactions: string[];
  challenge?: string;
};

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
    this.checkTransportResponse(response);
    const responseData = this.extractResponseData(response);
    const { publicKey } = this.extractPublicKeyAndChainCode(responseData);

    const address = "canton_" + this.publicKeyToAddress(publicKey);

    return {
      publicKey,
      address,
      path,
    };
  }

  /**
   * Sign a Canton transaction
   * using the appropriate signing method based on transaction type.
   *
   * @param path a path in BIP-32 format
   * @param data either prepared transaction components, untyped versioned message, or txHash string (backwards compatibility)
   * @return the signature
   */
  async signTransaction(
    path: string,
    data: CantonPreparedTransaction | CantonUntypedVersionedMessage | string,
  ): Promise<CantonSignature> {
    // Backwards compatibility: handle txHash string format
    if (typeof data === "string") {
      return this.signTxHash(path, data);
    }

    if ("damlTransaction" in data) {
      return this.signPreparedTransaction(path, data);
    } else {
      return this.signUntypedVersionedMessage(path, data);
    }
  }

  /**
   * Sign a transaction hash (backwards compatibility)
   * @private
   */
  private async signTxHash(path: string, txHash: string): Promise<CantonSignature> {
    // 1. Send the derivation path
    const bipPath = BIPPath.fromString(path).toPathArray();
    const serializedPath = this.serializePath(bipPath);

    const pathResponse = await this.transport.send(
      CLA,
      INS.SIGN,
      P1_SIGN_UNTYPED_VERSIONED_MESSAGE,
      P2_FIRST | P2_MORE,
      serializedPath,
    );

    this.checkTransportResponse(pathResponse);

    // 2. Send the transaction hash as a single transaction
    const transactionBuffer = Buffer.from(txHash, "hex");

    const response = await this.transport.send(
      CLA,
      INS.SIGN,
      P1_SIGN_UNTYPED_VERSIONED_MESSAGE,
      P2_MSG_END,
      transactionBuffer,
    );

    this.checkTransportResponse(response);
    const responseData = this.extractResponseData(response);
    return this.parseSignatureResponse(responseData);
  }

  /**
   * Sign a prepared Canton transaction
   * @private
   */
  private async signPreparedTransaction(
    path: string,
    components: CantonPreparedTransaction,
  ): Promise<CantonSignature> {
    let responseData: Buffer | null = null;

    // 1. Send the derivation path
    const bipPath = BIPPath.fromString(path).toPathArray();
    const serializedPath = this.serializePath(bipPath);

    const pathResponse = await this.transport.send(
      CLA,
      INS.SIGN,
      P1_SIGN_PREPARED_TRANSACTION,
      P2_FIRST | P2_MORE,
      serializedPath,
    );

    this.checkTransportResponse(pathResponse);

    // 2. Send the DAML transaction
    await this.sendChunkedData({
      ins: INS.SIGN,
      p1: P1_SIGN_PREPARED_TRANSACTION,
      payload: Buffer.from(components.damlTransaction),
      isFinal: false,
    });

    // 3. Send each node
    for (const [i, node] of components.nodes.entries()) {
      this.validateUint8Array(node, `Node at index ${i}`);
      await this.sendChunkedData({
        ins: INS.SIGN,
        p1: P1_SIGN_PREPARED_TRANSACTION,
        payload: Buffer.from(node),
        isFinal: false,
      });
    }

    // 4. Send the metadata
    const isFinal = components.inputContracts.length === 0;
    const result = await this.sendChunkedData({
      ins: INS.SIGN,
      p1: P1_SIGN_PREPARED_TRANSACTION,
      payload: Buffer.from(components.metadata),
      isFinal,
    });

    if (isFinal) {
      responseData = result;
    }

    // 5. Send each input contract - last one should return data
    for (const [i, inputContract] of components.inputContracts.entries()) {
      this.validateUint8Array(inputContract, `Input contract at index ${i}`);

      const isFinal = i === components.inputContracts.length - 1;
      const result = await this.sendChunkedData({
        ins: INS.SIGN,
        p1: P1_SIGN_PREPARED_TRANSACTION,
        payload: Buffer.from(inputContract),
        isFinal,
      });

      if (isFinal) {
        responseData = result;
      }
    }

    if (!responseData) {
      throw new Error("No response data received from device");
    }

    return this.parseSignatureResponse(responseData);
  }

  /**
   * Sign topology transactions for Canton onboarding
   * @private
   */
  private async signUntypedVersionedMessage(
    path: string,
    data: CantonUntypedVersionedMessage,
  ): Promise<CantonSignature> {
    const { transactions, challenge } = data;

    if (!transactions || transactions.length === 0) {
      throw new TypeError("At least one transaction is required");
    }

    // 1. Send the derivation path with optional challenge
    const bipPath = BIPPath.fromString(path).toPathArray();
    const serializedPath = this.serializePath(bipPath);

    let pathData = serializedPath;
    if (challenge) {
      const challengeBuffer = Buffer.from(challenge, "hex");
      pathData = Buffer.concat([serializedPath, challengeBuffer]);
    }

    const pathResponse = await this.transport.send(
      CLA,
      INS.SIGN,
      P1_SIGN_UNTYPED_VERSIONED_MESSAGE,
      P2_FIRST | P2_MORE,
      pathData,
    );

    this.checkTransportResponse(pathResponse);

    // 2. Send each transaction using chunking for large data
    for (const [i, transaction] of transactions.entries()) {
      if (!transaction) {
        throw new TypeError(`Transaction at index ${i} is undefined or null`);
      }

      const transactionBuffer = Buffer.from(transaction, "hex");
      const isLastTransaction = i === transactions.length - 1;

      if (transactionBuffer.length <= MAX_APDU_DATA_LENGTH) {
        // Small transaction - send directly
        const p2 = isLastTransaction ? P2_MSG_END : P2_MORE | P2_MSG_END;

        const response = await this.transport.send(
          CLA,
          INS.SIGN,
          P1_SIGN_UNTYPED_VERSIONED_MESSAGE,
          p2,
          transactionBuffer,
        );

        if (isLastTransaction) {
          this.checkTransportResponse(response);
          const responseData = this.extractResponseData(response);
          return this.parseSignatureResponse(responseData, challenge);
        } else {
          this.checkTransportResponse(response);
        }
      } else {
        // Large transaction - use chunking
        const responseData = await this.sendChunkedData({
          ins: INS.SIGN,
          p1: P1_SIGN_UNTYPED_VERSIONED_MESSAGE,
          payload: transactionBuffer,
          isFinal: isLastTransaction,
        });

        if (isLastTransaction && responseData) {
          return this.parseSignatureResponse(responseData, challenge);
        }
      }
    }

    throw new TypeError("No transactions provided");
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

    this.checkTransportResponse(response);
    const responseData = this.extractResponseData(response);
    const { major, minor, patch } = this.extractVersion(responseData);

    return {
      version: `${major}.${minor}.${patch}`,
    };
  }

  /**
   * Validate Uint8Array with descriptive error message
   * @private
   */
  private validateUint8Array(value: unknown, context: string): void {
    if (!value) {
      throw new TypeError(`${context} is undefined or null`);
    }
    if (!(value instanceof Uint8Array)) {
      throw new TypeError(`${context} is not a Uint8Array: ${typeof value}`);
    }
  }

  /**
   * Unified chunking strategy for sending data to device
   * @private
   */
  private async sendChunkedData({
    ins,
    p1,
    payload,
    isFinal = false,
  }: {
    ins: number;
    p1: number;
    payload: Buffer;
    isFinal?: boolean;
  }): Promise<Buffer | null> {
    const chunks = this.createChunks(payload);
    let responseData: Buffer | null = null;

    for (let i = 0; i < chunks.length; i++) {
      const isLastChunk = i === chunks.length - 1;
      let p2 = P2_MORE;

      if (isLastChunk) {
        p2 = isFinal ? P2_MSG_END : P2_MORE | P2_MSG_END;
      }

      const response = await this.transport.send(CLA, ins, p1, p2, chunks[i]);

      if (isFinal && isLastChunk) {
        this.checkTransportResponse(response);
        responseData = this.extractResponseData(response);
      } else {
        this.checkTransportResponse(response);
      }
    }

    return responseData;
  }

  /**
   * Create optimized chunks from payload
   * @private
   */
  private createChunks(payload: Buffer): Buffer[] {
    if (payload.length <= MAX_APDU_DATA_LENGTH) {
      return [payload];
    }

    const totalChunks = Math.ceil(payload.length / MAX_APDU_DATA_LENGTH);
    const chunks: Buffer[] = new Array(totalChunks);
    let offset = 0;

    for (let i = 0; i < totalChunks; i++) {
      const chunkSize = Math.min(MAX_APDU_DATA_LENGTH, payload.length - offset);
      chunks[i] = payload.slice(offset, offset + chunkSize);
      offset += chunkSize;
    }

    return chunks;
  }

  /**
   * Parse signature response - handles both TLV format (onboarding) and single signatures
   * @private
   */

  private parseSignatureResponse(response: Buffer, challenge?: string): CantonSignature {
    // Handle TLV (Type-Length-Value) format: [40][64B main][00][40][64B challenge] = 262 hex chars (131 bytes)
    if (
      response.length === 131 &&
      response.readUInt8(0) === SIGNATURE_FRAMING_BYTE &&
      response.readUInt8(65) === SIGNATURE_END_BYTE &&
      response.readUInt8(66) === SIGNATURE_FRAMING_BYTE
    ) {
      const signature = response.slice(1, 65).toString("hex");
      const applicationSignature = response.slice(67, 131).toString("hex");

      return {
        signature,
        ...(challenge && { applicationSignature }),
      };
    }

    // Handle single signature formats
    const signature = response.toString("hex");

    // Pure 64-byte Ed25519 signature = 128 hex chars (64 bytes)
    if (signature.length === ED25519_SIGNATURE_HEX_LENGTH) {
      return { signature };
    }

    // Canton-framed signature: [40][64B Ed25519 sig][00] = 132 hex chars (65 bytes)
    if (signature.length === CANTON_SIGNATURE_HEX_LENGTH) {
      const cleanedSignature = signature.slice(2, -2);
      return { signature: cleanedSignature };
    }

    return { signature };
  }

  /**
   * Check transport response for errors and throw appropriate exceptions
   * @private
   */
  private checkTransportResponse(response: Buffer): void {
    const statusCode = response.readUInt16BE(response.length - 2);

    if (statusCode !== STATUS.OK) {
      throw new TransportStatusError(statusCode);
    }
  }

  /**
   * Extract response data from transport response
   * APDU responses have format: [data][status_code(2_bytes)]
   * @private
   */
  private extractResponseData(response: Buffer): Buffer {
    return response.slice(0, -2);
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
   * Convert public key to address
   * @private
   */
  private publicKeyToAddress(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Extract Pubkey info from APDU response
   * @private
   * @returns Object with publicKey and chainCode as Buffer objects
   */
  private extractPublicKeyAndChainCode(data: Buffer) {
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

    return { publicKey: pubKey.toString("hex"), chainCode: chainCode.toString("hex") };
  }

  /**
   * Extract AppVersion from APDU response
   * @private
   */
  private extractVersion(data: Buffer): { major: number; minor: number; patch: number } {
    return {
      major: Number.parseInt(data.subarray(0, 1).toString("hex"), 16),
      minor: Number.parseInt(data.subarray(1, 2).toString("hex"), 16),
      patch: Number.parseInt(data.subarray(2, 3).toString("hex"), 16),
    };
  }
}
