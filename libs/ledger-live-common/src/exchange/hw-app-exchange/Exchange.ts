import Transport from "@ledgerhq/hw-transport";
import { BigNumber } from "bignumber.js";
import { TransportStatusError } from "@ledgerhq/errors";
import invariant from "invariant";

export const enum RateTypes {
  Fixed = 0x00,
  Floating = 0x01,
}

export const enum ExchangeTypes {
  Swap = 0x00,
  Sell = 0x01,
  Fund = 0x02,
}

const START_NEW_TRANSACTION_COMMAND = 0x03;
const SET_PARTNER_KEY_COMMAND = 0x04;
const CHECK_PARTNER_COMMAND = 0x05;
const PROCESS_TRANSACTION_RESPONSE = 0x06;
const CHECK_TRANSACTION_SIGNATURE = 0x07;
const CHECK_PAYOUT_ADDRESS = 0x08;
const CHECK_ASSET_IN = 0x08;
const CHECK_REFUND_ADDRESS = 0x09;
const SIGN_COIN_TRANSACTION = 0x0a;

const maybeThrowProtocolError = (result: Buffer): void => {
  invariant(result.length >= 2, "ExchangeTransport: Unexpected result length");
  const resultCode = result.readUInt16BE(result.length - 2);

  if (resultCode !== 0x9000) {
    throw new TransportStatusError(resultCode);
  }
};

export default class Exchange {
  transport: Transport;
  transactionType: ExchangeTypes;
  transactionRate: RateTypes;
  allowedStatuses: Array<number> = [
    0x9000, 0x6a80, 0x6a81, 0x6a82, 0x6a83, 0x6a84, 0x6a85, 0x6e00, 0x6d00,
    0x9d1a,
  ];

  constructor(
    transport: Transport,
    transactionType: ExchangeTypes,
    transactionRate?: RateTypes
  ) {
    this.transactionType = transactionType;
    this.transactionRate = transactionRate || RateTypes.Fixed;
    this.transport = transport;
  }

  async startNewTransaction(): Promise<string> {
    const result: Buffer = await this.transport.send(
      0xe0,
      START_NEW_TRANSACTION_COMMAND,
      this.transactionRate,
      this.transactionType,
      Buffer.alloc(0),
      this.allowedStatuses
    );
    maybeThrowProtocolError(result);

    if (
      this.transactionType === ExchangeTypes.Sell ||
      this.transactionType === ExchangeTypes.Fund
    ) {
      return result.slice(0, 32).toString("base64");
    }

    return result.toString("ascii", 0, 10);
  }

  async setPartnerKey(partnerNameAndPublicKey: Buffer): Promise<void> {
    const result: Buffer = await this.transport.send(
      0xe0,
      SET_PARTNER_KEY_COMMAND,
      this.transactionRate,
      this.transactionType,
      partnerNameAndPublicKey,
      this.allowedStatuses
    );
    maybeThrowProtocolError(result);
  }

  async checkPartner(signatureOfPartnerData: Buffer): Promise<void> {
    const result: Buffer = await this.transport.send(
      0xe0,
      CHECK_PARTNER_COMMAND,
      this.transactionRate,
      this.transactionType,
      signatureOfPartnerData,
      this.allowedStatuses
    );
    maybeThrowProtocolError(result);
  }

  async processTransaction(transaction: Buffer, fee: BigNumber): Promise<void> {
    let hex: string = fee.toString(16);
    hex = hex.padStart(hex.length + (hex.length % 2), "0");
    const feeHex: Buffer = Buffer.from(hex, "hex");
    const bufferToSend: Buffer = Buffer.concat([
      Buffer.from([transaction.length]),
      transaction,
      Buffer.from([feeHex.length]),
      feeHex,
    ]);
    const result: Buffer = await this.transport.send(
      0xe0,
      PROCESS_TRANSACTION_RESPONSE,
      this.transactionRate,
      this.transactionType,
      bufferToSend,
      this.allowedStatuses
    );
    maybeThrowProtocolError(result);
  }

  async checkTransactionSignature(transactionSignature: Buffer): Promise<void> {
    const result: Buffer = await this.transport.send(
      0xe0,
      CHECK_TRANSACTION_SIGNATURE,
      this.transactionRate,
      this.transactionType,
      transactionSignature,
      this.allowedStatuses
    );
    maybeThrowProtocolError(result);
  }

  async checkPayoutAddress(
    payoutCurrencyConfig: Buffer,
    currencyConfigSignature: Buffer,
    addressParameters: Buffer
  ): Promise<void> {
    invariant(payoutCurrencyConfig.length <= 255, "Currency config is too big");
    invariant(addressParameters.length <= 255, "Address parameter is too big.");
    invariant(
      currencyConfigSignature.length >= 67 &&
        currencyConfigSignature.length <= 73,
      "Signature should be DER serialized and have length in [67, 73] bytes."
    );
    const bufferToSend: Buffer = Buffer.concat([
      Buffer.from([payoutCurrencyConfig.length]),
      payoutCurrencyConfig,
      currencyConfigSignature,
      Buffer.from([addressParameters.length]),
      addressParameters,
    ]);
    const result: Buffer = await this.transport.send(
      0xe0,
      this.transactionType === ExchangeTypes.Swap
        ? CHECK_PAYOUT_ADDRESS
        : CHECK_ASSET_IN,
      this.transactionRate,
      this.transactionType,
      bufferToSend,
      this.allowedStatuses
    );
    maybeThrowProtocolError(result);
  }

  async checkRefundAddress(
    refundCurrencyConfig: Buffer,
    currencyConfigSignature: Buffer,
    addressParameters: Buffer
  ): Promise<void> {
    invariant(refundCurrencyConfig.length <= 255, "Currency config is too big");
    invariant(addressParameters.length <= 255, "Address parameter is too big.");
    invariant(
      currencyConfigSignature.length >= 67 &&
        currencyConfigSignature.length <= 73,
      "Signature should be DER serialized and have length in [67, 73] bytes."
    );
    const bufferToSend: Buffer = Buffer.concat([
      Buffer.from([refundCurrencyConfig.length]),
      refundCurrencyConfig,
      currencyConfigSignature,
      Buffer.from([addressParameters.length]),
      addressParameters,
    ]);
    const result: Buffer = await this.transport.send(
      0xe0,
      CHECK_REFUND_ADDRESS,
      this.transactionRate,
      this.transactionType,
      bufferToSend,
      this.allowedStatuses
    );
    maybeThrowProtocolError(result);
  }

  async signCoinTransaction(): Promise<void> {
    const result: Buffer = await this.transport.send(
      0xe0,
      SIGN_COIN_TRANSACTION,
      this.transactionRate,
      this.transactionType,
      Buffer.alloc(0),
      this.allowedStatuses
    );
    maybeThrowProtocolError(result);
  }
}
