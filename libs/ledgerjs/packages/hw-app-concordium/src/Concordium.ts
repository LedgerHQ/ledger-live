import Transport from "@ledgerhq/hw-transport";
import type {
  Transaction,
  Address,
  CredentialDeploymentTransaction,
  VerifyAddressResponse,
  SigningResult,
} from "./types";
import {
  serializeCredentialDeployment,
  serializeTransactionPayloads,
  serializeTransfer,
  serializeTransferWithMemo,
  prepareTransferAPDU,
  prepareTransferWithMemoAPDU,
} from "./serialization";
import { TransactionType } from "./types";
import { pathToBuffer } from "./utils";

const PUBLIC_KEY_LENGTH = 32;

const LEDGER_CLA = 0xe0;

const INS = {
  VERIFY_ADDRESS: 0x00,
  GET_PUBLIC_KEY: 0x01,
  SIGN_TRANSFER: 0x02,
  SIGN_TRANSFER_WITH_SCHEDULE: 0x03,
  SIGN_CREDENTIAL_DEPLOYMENT: 0x04,
  SIGN_TRANSFER_WITH_MEMO: 0x32,
  SIGN_TRANSFER_WITH_SCHEDULE_AND_MEMO: 0x34,
  REGISTER_DATA: 0x35,
  GET_VERSION: 0x00, // TODO: not implemented on device yet
};

const P1 = {
  VERIFY_ADDRESS: 0x01,
  NON_CONFIRM: 0x01,
  CONFIRM: 0x00,
  FIRST_CHUNK: 0x00,

  // Transfer
  INITIAL: 0x00,
  INITIAL_WITH_MEMO: 0x01,
  MEMO: 0x02,
  AMOUNT: 0x03,

  // Credential Deployment
  VERIFICATION_KEY_LENGTH: 0x0a,
  VERIFICATION_KEY: 0x01,
  SIGNATURE_THRESHOLD: 0x02,
  AR_IDENTITY: 0x03,
  CREDENTIAL_DATES: 0x04,
  ATTRIBUTE_TAG: 0x05,
  ATTRIBUTE_VALUE: 0x06,
  LENGTH_OF_PROOFS: 0x07,
  PROOFS: 0x08,
  NEW_OR_EXISTING: 0x09,
};

const P2 = {
  NONE: 0x00,
  MORE: 0x80,
  LAST: 0x00,
};

/**
 * Concordium Hardware Wallet API
 *
 * Provides low-level device communication for Concordium blockchain operations.
 * All transaction types use hw-app-specific formats (raw Buffers, no SDK dependencies).
 *
 * @param transport - Transport for sending commands to a device
 * @param scrambleKey - App-specific key used to scramble APDU data exchanges
 */
export default class Concordium {
  public transport: Transport;

  constructor(transport: Transport, scrambleKey = "concordium_default_scramble_key") {
    this.transport = transport;
    this.transport.decorateAppAPIMethods(
      this,
      [
        "getAddress",
        "verifyAddress",
        "getPublicKey",
        "signTransaction",
        "signCredentialDeployment",
      ],
      scrambleKey,
    );
  }

  /**
   * Helper to send an APDU and handle standard response parsing.
   * Note: Some methods require stripping the last 2 status bytes manually.
   */
  private async send(ins: number, p1: number, p2: number, data: Buffer): Promise<Buffer> {
    return this.transport.send(LEDGER_CLA, ins, p1, p2, data);
  }

  /**
   * Get Concordium address for a given path.
   *
   * @param originalPath - BIP32 path
   * @param display - Whether to display/verify address on device (default: false)
   * @param id - Identity number
   * @param cred - Credential number
   * @param idp - Identity provider number
   * @returns Promise with address and publicKey
   */
  async getAddress(
    originalPath: string,
    display: boolean = false,
    id: number,
    cred: number,
    idp: number,
  ): Promise<Address> {
    // When display is false or undefined, use GET_PUBLIC_KEY to avoid verification
    // This prevents device verification prompts during account scanning
    if (display !== true) {
      const payload = pathToBuffer(originalPath);
      const p1 = P1.NON_CONFIRM; // P1=0x01 means skip UI
      const response = await this.send(INS.GET_PUBLIC_KEY, p1, P2.NONE, payload);

      const publicKey = response.subarray(0, PUBLIC_KEY_LENGTH).toString("hex");
      // Use public key as address for device matching (not the on-chain address)
      return { address: publicKey, publicKey };
    }

    // When display is true, use VERIFY_ADDRESS
    if (id === undefined || cred === undefined || idp === undefined) {
      throw new Error("idp, id, and cred must be provided for new path");
    }

    const payload = Buffer.alloc(12);

    payload.writeUInt32BE(idp, 0);
    payload.writeUInt32BE(id, 4);
    payload.writeUInt32BE(cred, 8);

    const response = await this.send(INS.VERIFY_ADDRESS, P1.VERIFY_ADDRESS, P2.NONE, payload);

    const addressLength = response[0];
    const address = response.subarray(1, 1 + addressLength).toString("ascii");
    // For VERIFY_ADDRESS, we don't get publicKey in response, so we need to get it separately
    const publicKeyPayload = pathToBuffer(originalPath);
    const publicKeyResponse = await this.send(
      INS.GET_PUBLIC_KEY,
      P1.NON_CONFIRM,
      P2.NONE,
      publicKeyPayload,
    );
    const publicKey = publicKeyResponse.subarray(0, PUBLIC_KEY_LENGTH).toString("hex");

    return { address, publicKey };
  }

  /**
   * Verify address on device.
   *
   * @param id - Identity number
   * @param cred - Credential number
   * @param idp - Identity provider number
   * @param credentialId - Credential ID (hex) to compute on-chain address
   * @returns Promise with status, address, deviceCredId, and devicePrfKey
   */
  async verifyAddress(
    id: number,
    cred: number,
    idp: number,
    credentialId?: string,
  ): Promise<VerifyAddressResponse> {
    if (id === undefined || cred === undefined || idp === undefined) {
      throw new Error("idp, id, and cred must be provided for new path");
    }

    const payload = Buffer.alloc(12);

    payload.writeUInt32BE(idp, 0);
    payload.writeUInt32BE(id, 4);
    payload.writeUInt32BE(cred, 8);

    const response = await this.send(INS.VERIFY_ADDRESS, P1.VERIFY_ADDRESS, P2.NONE, payload);

    const addressLength = response[0];
    const address = response.subarray(1, 1 + addressLength).toString("ascii");

    let deviceCredId: string | undefined;
    let devicePrfKey: string | undefined;

    if (credentialId) {
      let offset = 1 + addressLength;
      if (offset + 48 <= response.length) {
        deviceCredId = response.subarray(offset, offset + 48).toString("hex");
        offset += 48;
      }
      if (offset + 32 <= response.length) {
        devicePrfKey = response.subarray(offset, offset + 32).toString("hex");
      }
    }

    return { status: "9000", address, deviceCredId, devicePrfKey };
  }

  /**
   * Get public key for a given path.
   *
   * @param path - BIP32 path
   * @param confirm - Require user confirmation on device (default: false)
   * @returns Promise with public key (hex string)
   */
  async getPublicKey(path: string, confirm = false): Promise<string> {
    const payload = pathToBuffer(path);
    const p1 = confirm ? P1.CONFIRM : P1.NON_CONFIRM;

    const response = await this.send(INS.GET_PUBLIC_KEY, p1, P2.NONE, payload);

    return response.subarray(0, PUBLIC_KEY_LENGTH).toString("hex");
  }

  /**
   * Sign a transaction (Transfer or TransferWithMemo).
   * Routes to the appropriate signing method based on transaction type.
   *
   * @param tx - Transaction to sign
   * @param path - BIP32 path for signing key
   * @returns Promise with signature and serialized transaction
   */
  async signTransaction(tx: Transaction, path: string): Promise<SigningResult> {
    if (tx.type === TransactionType.TransferWithMemo) {
      return this.signTransferWithMemo(tx, path);
    }
    return this.signTransfer(tx, path);
  }

  /**
   * Sign a Transfer transaction (internal method).
   *
   * @param tx - Transfer transaction with type-safe payload
   * @param path - BIP32 path for signing key
   * @returns Promise with signature and serialized transaction
   */
  private async signTransfer(tx: Transaction, path: string): Promise<SigningResult> {
    if (tx.type !== TransactionType.Transfer) {
      throw new Error("Transaction type must be Transfer");
    }

    const serialized = serializeTransfer(tx);

    // Prepare APDU payloads for device (chunked)
    const payloads = prepareTransferAPDU(serialized, path);

    // Send APDU commands
    let response: Buffer = Buffer.alloc(0);
    for (let i = 0; i < payloads.length; i++) {
      const p2 = i === payloads.length - 1 ? P2.LAST : P2.MORE;
      response = await this.send(INS.SIGN_TRANSFER, P1.INITIAL, p2, payloads[i]);
    }

    const signature = response.subarray(0, -2).toString("hex");
    return {
      signature,
      serialized: serialized.toString("hex"),
    };
  }

  /**
   * Sign a TransferWithMemo transaction (internal method).
   *
   * @param tx - TransferWithMemo transaction with type-safe payload
   * @param path - BIP32 path for signing key
   * @returns Promise with signature and serialized transaction
   */
  private async signTransferWithMemo(tx: Transaction, path: string): Promise<SigningResult> {
    if (tx.type !== TransactionType.TransferWithMemo) {
      throw new Error("Transaction type must be TransferWithMemo");
    }

    const serialized = serializeTransferWithMemo(tx);

    // Prepare APDU payloads for device (parses serialized transaction)
    const { headerPayload, memoPayloads, amountPayload } = prepareTransferWithMemoAPDU(
      serialized,
      path,
    );

    // Send APDU commands (special 3-step sequence for TransferWithMemo)
    await this.send(INS.SIGN_TRANSFER_WITH_MEMO, P1.INITIAL_WITH_MEMO, P2.NONE, headerPayload);

    for (const memoPayload of memoPayloads) {
      await this.send(INS.SIGN_TRANSFER_WITH_MEMO, P1.MEMO, P2.NONE, memoPayload);
    }

    const response = await this.send(
      INS.SIGN_TRANSFER_WITH_MEMO,
      P1.AMOUNT,
      P2.NONE,
      amountPayload,
    );

    const signature = response.subarray(0, -2).toString("hex");
    return {
      signature,
      serialized: serialized.toString("hex"),
    };
  }

  /**
   * Sign a credential deployment transaction.
   *
   * Always creates credentials for new accounts on existing identities.
   * The device displays the expiry time for user verification.
   *
   * @param tx - CredentialDeploymentTransaction in hw-app format
   * @param path - BIP32 path for signing key
   * @returns Promise with signature (hex string)
   */
  async signCredentialDeployment(
    tx: CredentialDeploymentTransaction,
    path: string,
  ): Promise<string> {
    const serialized = serializeCredentialDeployment(tx, path);
    let response: Buffer = Buffer.alloc(0);

    const send = async (p1: number, p2: number, data: Buffer) =>
      this.send(INS.SIGN_CREDENTIAL_DEPLOYMENT, p1, p2, data);

    // 1. Initial Packet (Path)
    await send(P1.FIRST_CHUNK, P2.MORE, serialized.payloadDerivationPath);

    // 2. Verification Keys
    await send(P1.VERIFICATION_KEY_LENGTH, P2.MORE, serialized.numberOfVerificationKeys);
    for (const key of serialized.verificationKeys) {
      await send(P1.VERIFICATION_KEY, P2.MORE, key);
    }

    // 3. Threshold, RegId, IP Identity
    await send(P1.SIGNATURE_THRESHOLD, P2.MORE, serialized.thresholdAndRegIdAndIPIdentity);

    // 4. Anonymity Revocation Identity pairs
    for (const arData of serialized.encIdCredPubShareAndKey) {
      await send(P1.AR_IDENTITY, P2.MORE, arData);
    }

    // 5. Credential Dates and Attributes
    await send(P1.CREDENTIAL_DATES, P2.MORE, serialized.validToAndCreatedAtAndAttributesLength);

    for (let i = 0; i < serialized.tag.length; i++) {
      await send(P1.ATTRIBUTE_TAG, P2.MORE, serialized.tag[i]);
      await send(P1.ATTRIBUTE_VALUE, P2.MORE, serialized.valueLength[i]);

      const valuePayloads = serializeTransactionPayloads(serialized.value[i]);
      for (const valueChunk of valuePayloads) {
        await send(P1.ATTRIBUTE_VALUE, P2.MORE, valueChunk);
      }
    }

    // 6. Proofs
    await send(P1.LENGTH_OF_PROOFS, P2.MORE, serialized.proofLength);

    const proofsPayloads = serializeTransactionPayloads(serialized.proofs);
    for (const proofsPayload of proofsPayloads) {
      await send(P1.PROOFS, P2.MORE, proofsPayload);
    }

    // 7. Send expiry (always for new account creation)
    response = await send(P1.NEW_OR_EXISTING, P2.LAST, serialized.newOrExistingPayload);

    return response.subarray(0, -2).toString("hex");
  }
}
