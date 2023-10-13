import Transport from "@ledgerhq/hw-transport";
import { BigNumber } from "bignumber.js";
import { TransportStatusError } from "@ledgerhq/errors";
import invariant from "invariant";

import { OkStatus, ErrorStatus } from "./ReturnCode";

export const enum RateTypes {
  Fixed = 0x00,
  Floating = 0x01,
}

export const enum ExchangeTypes {
  Swap = 0x00,
  Sell = 0x01,
  Fund = 0x02,
  SwapNg = 0x03,
  SellNg = 0x04,
  FundNg = 0x05,
}
const ExchangeTypeNg = [ExchangeTypes.SwapNg, ExchangeTypes.SellNg, ExchangeTypes.FundNg];

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

  if (resultCode !== OkStatus) {
    throw new TransportStatusError(resultCode);
  }
};

export function getExchageErrorMessage(errorCode: number): string | undefined {
  switch (errorCode) {
    case ErrorStatus.INCORRECT_COMMAND_DATA:
      return "Incorrect command data";
    case ErrorStatus.DESERIALIZATION_FAILED:
      return "Payload deserialzation failed";
    case ErrorStatus.WRONG_TRANSACTION_ID:
      return "Wrond transaction id";
    case ErrorStatus.INVALID_ADDRESS:
      return "Invalid address";
    case ErrorStatus.USER_REFUSED:
      return "User refused";
    case ErrorStatus.INTERNAL_ERROR:
      return "Internal error";
    case ErrorStatus.WRONG_P1:
      return "Wrong P1";
    case ErrorStatus.WRONG_P2:
      return "Wrong P2";
    case ErrorStatus.CLASS_NOT_SUPPORTED:
      return "Class not supported";
    case ErrorStatus.INVALID_INSTRUCTION:
      return "Invalid instruction";
    case ErrorStatus.SIGN_VERIFICATION_FAIL:
      return "Signature verification failed";
  }
  return undefined;
}

export type PartnerKeyInfo = {
  name: string;
  curve: string;
  publicKey: Buffer;
  signatureComputedFormat?: PayloadSignatureComputedFormat;
};
const curves = {
  secp256k1: 0x00,
  secp256r1: 0x01,
};
export type PayloadSignatureComputedFormat = "raw" | "jws";
const transactionEncodedFormat = {
  raw: 0x00,
  base64: 0x01,
};

/**
 * Adapt ExchangeTypes following partner info.
 * For "legacy" partner, we don't change the provided type.
 * For new one, we call the new APDU commands (Ng, Next Gen).
 */
function resolveTransactionType(type: ExchangeTypes, partnerVersion?: number): ExchangeTypes {
  if (partnerVersion === undefined || partnerVersion === 1) {
    return type;
  }

  switch (type) {
    case ExchangeTypes.Swap:
      return ExchangeTypes.SwapNg;
    case ExchangeTypes.Sell:
      return ExchangeTypes.SellNg;
    case ExchangeTypes.Fund:
      return ExchangeTypes.FundNg;
    default:
      return type;
  }
}

export function createExchange(
  transport: Transport,
  transactionType: ExchangeTypes,
  transactionRate?: RateTypes,
  version?: number,
): Exchange {
  return new Exchange(transport, resolveTransactionType(transactionType, version), transactionRate);
}

export default class Exchange {
  transport: Transport;
  transactionType: ExchangeTypes;
  transactionRate: RateTypes;
  allowedStatuses: Array<number> = [...Object.values(ErrorStatus), OkStatus];

  constructor(transport: Transport, transactionType: ExchangeTypes, transactionRate?: RateTypes) {
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
      this.allowedStatuses,
    );
    maybeThrowProtocolError(result);

    switch (this.transactionType) {
      case ExchangeTypes.Sell:
      case ExchangeTypes.Fund:
        return result.slice(0, 32).toString("base64");
      case ExchangeTypes.Swap:
        return result.toString("ascii", 0, 10);
      default:
        return result.subarray(0, 32).toString("hex");
    }
  }

  async setPartnerKey(info: PartnerKeyInfo): Promise<void> {
    const partnerNameAndPublicKey = this.getPartnerKeyInfo(info);
    const result: Buffer = await this.transport.send(
      0xe0,
      SET_PARTNER_KEY_COMMAND,
      this.transactionRate,
      this.transactionType,
      partnerNameAndPublicKey,
      this.allowedStatuses,
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
      this.allowedStatuses,
    );
    maybeThrowProtocolError(result);
  }

  async processTransaction(
    transaction: Buffer,
    fee: BigNumber,
    compFormat?: PayloadSignatureComputedFormat,
  ): Promise<void> {
    let hex = fee.toString(16);
    hex = hex.padStart(hex.length + (hex.length % 2), "0");
    const feeHex = Buffer.from(hex, "hex");

    const P2None = 0x00 << 4;
    const P2Extend = 0x01 << 4;
    const P2More = 0x02 << 4;

    let bufferToSend: Buffer;
    if (this.isExchangeTypeNg()) {
      const encodedFormat =
        compFormat === "jws" ? transactionEncodedFormat.base64 : transactionEncodedFormat.raw;

      if (encodedFormat === transactionEncodedFormat.base64) {
        transaction = transaction.subarray(1);
      }

      bufferToSend = Buffer.concat([
        Buffer.from([encodedFormat]),
        Buffer.from([(transaction.length >> 8) % 256, transaction.length % 256]),
        transaction,
        Buffer.from([feeHex.length]),
        feeHex,
      ]);

      if (bufferToSend.length >= 256) {
        console.log("OVERSIZED");
        const dataLength = bufferToSend.length;

        for (let i = 0; i < Math.floor(dataLength / 256); i++) {
          const start = 255 * i;
          const end = start + 255;
          const data = bufferToSend.subarray(start, end);

          const extFlag = i == 0 ? P2More : P2More << P2Extend;

          console.log("SEND SIZE:", data.length);

          await this.transport.send(
            0xe0,
            PROCESS_TRANSACTION_RESPONSE,
            this.transactionRate,
            this.transactionType | extFlag,
            data,
            this.allowedStatuses,
          );
        }

        console.log("TERMINAL SEND");

        const result: Buffer = await this.transport.send(
          0xe0,
          PROCESS_TRANSACTION_RESPONSE,
          this.transactionRate,
          this.transactionType | P2Extend,
          bufferToSend.subarray(dataLength - (dataLength % 255), dataLength),
          this.allowedStatuses,
        );

        maybeThrowProtocolError(result);
        return;
      }
    } else {
      bufferToSend = Buffer.concat([
        Buffer.from([transaction.length]),
        transaction,
        Buffer.from([feeHex.length]),
        feeHex,
      ]);
    }
    const result: Buffer = await this.transport.send(
      0xe0,
      PROCESS_TRANSACTION_RESPONSE,
      this.transactionRate,
      this.transactionType | P2None,
      bufferToSend,
      this.allowedStatuses,
    );
    maybeThrowProtocolError(result);
  }

  async checkTransactionSignature(transactionSignature: Buffer): Promise<void> {
    const DOT_PREFIX = 0x01;
    const RS_FORMAT = 0x01;
    if (this.isExchangeTypeNg()) {
      transactionSignature = Buffer.concat([
        Buffer.from([DOT_PREFIX, RS_FORMAT]),
        transactionSignature,
      ]);
    }

    const result: Buffer = await this.transport.send(
      0xe0,
      CHECK_TRANSACTION_SIGNATURE,
      this.transactionRate,
      this.transactionType,
      transactionSignature,
      this.allowedStatuses,
    );
    maybeThrowProtocolError(result);
  }

  async checkPayoutAddress(
    payoutCurrencyConfig: Buffer,
    currencyConfigSignature: Buffer,
    addressParameters: Buffer,
  ): Promise<void> {
    invariant(payoutCurrencyConfig.length <= 255, "Currency config is too big");
    invariant(addressParameters.length <= 255, "Address parameter is too big.");
    invariant(
      currencyConfigSignature.length >= 67 && currencyConfigSignature.length <= 73,
      "Signature should be DER serialized and have length in [67, 73] bytes.",
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
      this.transactionType === ExchangeTypes.Swap ? CHECK_PAYOUT_ADDRESS : CHECK_ASSET_IN,
      this.transactionRate,
      this.transactionType,
      bufferToSend,
      this.allowedStatuses,
    );
    maybeThrowProtocolError(result);
  }

  async checkRefundAddress(
    refundCurrencyConfig: Buffer,
    currencyConfigSignature: Buffer,
    addressParameters: Buffer,
  ): Promise<void> {
    invariant(refundCurrencyConfig.length <= 255, "Currency config is too big");
    invariant(addressParameters.length <= 255, "Address parameter is too big.");
    invariant(
      currencyConfigSignature.length >= 67 && currencyConfigSignature.length <= 73,
      "Signature should be DER serialized and have length in [67, 73] bytes.",
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
      this.allowedStatuses,
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
      this.allowedStatuses,
    );
    maybeThrowProtocolError(result);
  }

  private getPartnerKeyInfo({ name, curve, publicKey }: PartnerKeyInfo): Buffer {
    if (this.isExchangeTypeNg()) {
      return Buffer.concat([
        Buffer.from([name.length]),
        Buffer.from(name, "ascii"),
        Buffer.from([curves[curve]]),
        publicKey,
      ]);
    }

    return Buffer.concat([Buffer.from([name.length]), Buffer.from(name, "ascii"), publicKey]);
  }

  private isExchangeTypeNg(): boolean {
    return ExchangeTypeNg.includes(this.transactionType);
  }
}
