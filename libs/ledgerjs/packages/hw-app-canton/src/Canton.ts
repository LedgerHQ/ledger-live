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

const MAX_APDU_DATA_LENGTH = 255;
const TLV_SIGNATURE_LENGTH = 131; // bytes: [40][64B main][00][40][64B challenge]
const TLV_SIGNATURE_START_OFFSET = 1; // After framing byte
const TLV_SIGNATURE_END_OFFSET = 65; // End of main signature
const TLV_APPLICATION_SIGNATURE_START_OFFSET = 67; // After [00][40]
const TLV_APPLICATION_SIGNATURE_END_OFFSET = 131; // End of application signature
const ED25519_SIGNATURE_BYTE_LENGTH = 64; // bytes

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
    const serializedPath = this.serializeBipPath(path);

    const p1 = display ? P1_CONFIRM : P1_NON_CONFIRM;

    const response = await this.transport.send(CLA, INS.GET_ADDR, p1, P2_NONE, serializedPath);
    this.checkTransportResponse(response);
    const responseData = this.extractResponseData(response);
    const { publicKey } = this.extractPublicKeyAndChainCode(responseData);

    const address = `canton_${this.publicKeyToAddress(publicKey)}`;

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
    // Reuse signUntypedVersionedMessage with a single transaction
    return this.signUntypedVersionedMessage(path, {
      transactions: [txHash],
    });
  }

  /**
   * Sign a prepared Canton transaction
   * @private
   */
  private async signPreparedTransaction(
    path: string,
    components: CantonPreparedTransaction,
  ): Promise<CantonSignature> {
    this.validateUint8Array(components.damlTransaction, "DAML transaction");
    this.validateUint8Array(components.metadata, "Metadata");
    components.nodes.forEach((node, i) => {
      this.validateUint8Array(node, `Node at index ${i}`);
    });
    components.inputContracts.forEach((inputContract, i) => {
      this.validateUint8Array(inputContract, `Input contract at index ${i}`);
    });

    const damlTransactionBuffer = Buffer.from(components.damlTransaction);
    const metadataBuffer = Buffer.from(components.metadata);
    const nodeBuffers = components.nodes.map(node => Buffer.from(node));
    const inputContractBuffers = components.inputContracts.map(inputContract =>
      Buffer.from(inputContract),
    );

    let responseData: Buffer | null = null;

    // 1. Send the derivation path
    const serializedPath = this.serializeBipPath(path);

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
      payload: damlTransactionBuffer,
      isFinal: false,
    });

    // 3. Send each node
    for (const nodeBuffer of nodeBuffers) {
      await this.sendChunkedData({
        ins: INS.SIGN,
        p1: P1_SIGN_PREPARED_TRANSACTION,
        payload: nodeBuffer,
        isFinal: false,
      });
    }

    // 4. Send the metadata
    const isFinal = inputContractBuffers.length === 0;
    const result = await this.sendChunkedData({
      ins: INS.SIGN,
      p1: P1_SIGN_PREPARED_TRANSACTION,
      payload: metadataBuffer,
      isFinal,
    });

    if (isFinal) {
      responseData = result;
    }

    // 5. Send each input contract - last one should return data
    for (const [i, inputContractBuffer] of inputContractBuffers.entries()) {
      const isFinal = i === inputContractBuffers.length - 1;
      const result = await this.sendChunkedData({
        ins: INS.SIGN,
        p1: P1_SIGN_PREPARED_TRANSACTION,
        payload: inputContractBuffer,
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

    // Pre-validate all transactions upfront
    if (!transactions || transactions.length === 0) {
      throw new TypeError("At least one transaction is required");
    }

    transactions.forEach((transaction, i) => {
      if (!transaction) {
        throw new TypeError(`Transaction at index ${i} is undefined or null`);
      }
    });

    // Pre-convert all hex strings to Buffers
    const transactionBuffers = transactions.map(transaction => Buffer.from(transaction, "hex"));

    // 1. Send the derivation path with optional challenge
    const serializedPath = this.serializeBipPath(path);

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

    // 2. Send each transaction using consistent chunking
    for (const [i, transactionBuffer] of transactionBuffers.entries()) {
      const isLastTransaction = i === transactionBuffers.length - 1;
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
   *
   * P2 flag combinations per protocol (see app-canton/doc/APDU.md):
   * - P2_MORE (0x02): More chunks to come for current transaction
   * - P2_MORE | P2_MSG_END (0x06): Transaction complete, more transactions expected
   * - P2_MSG_END (0x04): Final transaction, end of sequence
   *
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

    for (const [i, chunk] of chunks.entries()) {
      const isLastChunk = i === chunks.length - 1;
      let p2 = P2_MORE;

      if (isLastChunk) {
        // Last chunk: P2_MSG_END if final transaction, P2_MORE | P2_MSG_END if more transactions follow
        p2 = isFinal ? P2_MSG_END : P2_MORE | P2_MSG_END;
      }

      const response = await this.transport.send(CLA, ins, p1, p2, chunk);

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
    // Handle TLV (Type-Length-Value) format: [40][64B main][00][40][64B challenge] = 131 bytes
    if (
      response.length === TLV_SIGNATURE_LENGTH &&
      response.readUInt8(0) === SIGNATURE_FRAMING_BYTE &&
      response.readUInt8(TLV_SIGNATURE_END_OFFSET) === SIGNATURE_END_BYTE &&
      response.readUInt8(TLV_APPLICATION_SIGNATURE_START_OFFSET - 1) === SIGNATURE_FRAMING_BYTE
    ) {
      const signature = response
        .slice(TLV_SIGNATURE_START_OFFSET, TLV_SIGNATURE_END_OFFSET)
        .toString("hex");
      const applicationSignature = response
        .slice(TLV_APPLICATION_SIGNATURE_START_OFFSET, TLV_APPLICATION_SIGNATURE_END_OFFSET)
        .toString("hex");

      // Include applicationSignature only if challenge was provided in the request
      return {
        signature,
        ...(challenge && { applicationSignature }),
      };
    }

    // Handle single signature formats - check length before converting to hex
    if (response.length === ED25519_SIGNATURE_BYTE_LENGTH) {
      // Pure 64-byte Ed25519 signature = 128 hex chars (64 bytes)
      return { signature: response.toString("hex") };
    }

    if (response.length === ED25519_SIGNATURE_BYTE_LENGTH + 2) {
      // Canton-framed signature: [40][64B Ed25519 sig][00] = 66 bytes (132 hex chars)
      const cleanedSignature = response.slice(1, -1).toString("hex");
      return { signature: cleanedSignature };
    }

    // Fallback: return as hex string
    return { signature: response.toString("hex") };
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
   * Serialize a BIP-32 path string to a data buffer for Canton BOLOS
   * @private
   */
  private serializeBipPath(pathString: string): Buffer {
    const bipPath = BIPPath.fromString(pathString).toPathArray();
    return this.serializePath(bipPath);
  }

  /**
   * Serialize a BIP path array to a data buffer for Canton BOLOS
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
   * @returns Object with publicKey and chainCode as hex strings
   */
  private extractPublicKeyAndChainCode(data: Buffer): {
    publicKey: string;
    chainCode: string;
  } {
    // Parse the response according to the Python unpack_get_addr_response format:
    // response = pubkey_len (1) + pubkey (var) + chaincode_len (1) + chaincode (var)

    // Bounds checking: ensure we have at least 1 byte for pubkey length
    if (data.length < 1) {
      throw new Error("Invalid response: insufficient data for public key length");
    }

    let offset = 0;

    // Extract public key length (1 byte)
    const pubkeySize = data.readUInt8(offset);
    offset += 1;

    // Bounds checking: ensure we have enough data for public key
    if (data.length < offset + pubkeySize) {
      throw new Error(
        `Invalid response: insufficient data for public key (expected ${pubkeySize} bytes)`,
      );
    }

    // Extract public key
    const pubKey = data.subarray(offset, offset + pubkeySize);
    offset += pubkeySize;

    // Bounds checking: ensure we have at least 1 byte for chaincode length
    if (data.length < offset + 1) {
      throw new Error("Invalid response: insufficient data for chaincode length");
    }

    // Extract chain code length (1 byte)
    const chainCodeSize = data.readUInt8(offset);
    offset += 1;

    // Bounds checking: ensure we have enough data for chaincode
    if (data.length < offset + chainCodeSize) {
      throw new Error(
        `Invalid response: insufficient data for chaincode (expected ${chainCodeSize} bytes)`,
      );
    }

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
      major: data.readUInt8(0),
      minor: data.readUInt8(1),
      patch: data.readUInt8(2),
    };
  }
}
