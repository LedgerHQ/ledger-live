// @flow
import type Transport from "@ledgerhq/hw-transport";

const START_NEW_TRANSACTION_COMMAND: number = 0x01;
const SET_PARTNER_KEY_COMMAND: number = 0x02;
const CHECK_PARTNER_COMMAND: number = 0x03;
const PROCESS_TRANSACTION_RESPONSE: number = 0x04;
const CHECK_TRANSACTION_SIGNATURE: number = 0x05;
const CHECK_PAYOUT_ADDRESS: number = 0x06;
const CHECK_REFUND_ADDRESS: number = 0x07;

export default class Swap {
  transport: Transport<*>;
  allowedStatuses: Array<number> = [
    0x9000,
    0x6a80,
    0x6a81,
    0x6a82,
    0x6a83,
    0x6a84,
    0x6a85,
    0x6e00,
    0x6d00,
    0x9d1a
  ];

  constructor(transport: Transport<*>) {
    this.transport = transport;
  }

  isSuccess(result: Buffer): boolean {
    return (
      result.length >= 2 && result.readUInt16BE(result.length - 2) === 0x9000
    );
  }

  mapProtocolError(result: Buffer): void {
    if (result.length < 2) throw new Error("Response length is too small");
    var errorMessage: string;
    switch (result.readUInt16BE(result.length - 2)) {
      case 0x6a80:
        errorMessage = "INCORRECT_COMMAND_DATA";
        break;
      case 0x6a81:
        errorMessage = "DESERIALIZATION_FAILED";
        break;
      case 0x6a82:
        errorMessage = "WRONG_TRANSACTION_ID";
        break;
      case 0x6a83:
        errorMessage = "INVALID_ADDRESS";
        break;
      case 0x6a84:
        errorMessage = "USER_REFUSED";
        break;
      case 0x6a85:
        errorMessage = "INTERNAL_ERROR";
        break;
      case 0x6e00:
        errorMessage = "CLASS_NOT_SUPPORTED";
        break;
      case 0x6d00:
        errorMessage = "INVALID_INSTRUCTION";
        break;
      case 0x9d1a:
        errorMessage = "SIGN_VERIFICATION_FAIL";
        break;
      default:
        errorMessage = "Unknown error";
        break;
    }
    throw new Error("Swap application report error " + errorMessage);
  }

  async startNewTransaction(): Promise<string> {
    let result: Buffer = await this.transport.send(
      0xe0,
      START_NEW_TRANSACTION_COMMAND,
      0x00,
      0x00,
      Buffer.alloc(0),
      this.allowedStatuses
    );
    if (!this.isSuccess(result)) this.mapProtocolError(result);
    if (result.length !== 12)
      throw new Error("APDU response length should be 12");
    return result.toString("ascii", 0, 10);
  }

  async setPartnerKey(partnerNameAndPublicKey: Buffer): Promise<void> {
    let result: Buffer = await this.transport.send(
      0xe0,
      SET_PARTNER_KEY_COMMAND,
      0x00,
      0x00,
      partnerNameAndPublicKey,
      this.allowedStatuses
    );
    if (!this.isSuccess(result)) this.mapProtocolError(result);
  }

  async checkPartner(signatureOfPartnerData: Buffer): Promise<void> {
    let result: Buffer = await this.transport.send(
      0xe0,
      CHECK_PARTNER_COMMAND,
      0x00,
      0x00,
      signatureOfPartnerData,
      this.allowedStatuses
    );
    if (!this.isSuccess(result)) this.mapProtocolError(result);
  }

  async processTransaction(transaction: Buffer): Promise<void> {
    let result: Buffer = await this.transport.send(
      0xe0,
      PROCESS_TRANSACTION_RESPONSE,
      0x00,
      0x00,
      transaction,
      this.allowedStatuses
    );
    if (!this.isSuccess(result)) this.mapProtocolError(result);
  }

  async checkTransactionSignature(transactionSignature: Buffer): Promise<void> {
    let result: Buffer = await this.transport.send(
      0xe0,
      CHECK_TRANSACTION_SIGNATURE,
      0x00,
      0x00,
      transactionSignature,
      this.allowedStatuses
    );
    if (!this.isSuccess(result)) this.mapProtocolError(result);
  }

  async checkPayoutAddress(
    payoutCurrencyConfig: Buffer,
    currencyConfigSignature: Buffer,
    addressParameters: Buffer
  ): Promise<void> {
    if (payoutCurrencyConfig.length > 255) {
      throw new Error("Currency config is too big");
    }
    if (
      currencyConfigSignature.length < 70 ||
      currencyConfigSignature.length > 73
    ) {
      throw new Error(
        "Signature should be DER serialized and have length in [70, 73] bytes"
      );
    }
    if (addressParameters.length > 255) {
      throw new Error("Address parameters is too big");
    }
    const bufferToSend: Buffer = Buffer.concat([
      Buffer.from([payoutCurrencyConfig.length]),
      payoutCurrencyConfig,
      currencyConfigSignature,
      Buffer.from([addressParameters.length]),
      addressParameters
    ]);
    let result: Buffer = await this.transport.send(
      0xe0,
      CHECK_PAYOUT_ADDRESS,
      0x00,
      0x00,
      bufferToSend,
      this.allowedStatuses
    );
    if (!this.isSuccess(result)) this.mapProtocolError(result);
  }

  async checkRefundAddress(
    refundCurrencyConfig: Buffer,
    currencyConfigSignature: Buffer,
    addressParameters: Buffer
  ): Promise<void> {
    if (refundCurrencyConfig.length > 255) {
      throw new Error("Currency config is too big");
    }
    if (
      currencyConfigSignature.length < 70 ||
      currencyConfigSignature.length > 73
    ) {
      throw new Error(
        "Signature should be DER serialized and have length in [70, 73] bytes"
      );
    }
    if (addressParameters.length > 255) {
      throw new Error("Address parameters is too big");
    }
    const bufferToSend: Buffer = Buffer.concat([
      Buffer.from([refundCurrencyConfig.length]),
      refundCurrencyConfig,
      currencyConfigSignature,
      Buffer.from([addressParameters.length]),
      addressParameters
    ]);
    let result: Buffer = await this.transport.send(
      0xe0,
      CHECK_REFUND_ADDRESS,
      0x00,
      0x00,
      bufferToSend,
      this.allowedStatuses
    );
    if (!this.isSuccess(result)) this.mapProtocolError(result);
  }
}
