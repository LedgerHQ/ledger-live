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

export function isExchangeTypeNg(type: ExchangeTypes): boolean {
  return ExchangeTypeNg.includes(type);
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

// Extension for PROCESS_TRANSACTION_RESPONSE APDU
const P2_NONE = 0x00 << 4;
const P2_EXTEND = 0x01 << 4;
const P2_MORE = 0x02 << 4;

const maybeThrowProtocolError = (result: Buffer): void => {
  invariant(result.length >= 2, "ExchangeTransport: Unexpected result length");
  const resultCode = result.readUInt16BE(result.length - 2);

  if (resultCode !== OkStatus) {
    throw new TransportStatusError(resultCode);
  }
};

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
function computedFormatToEncodedFormat(format: PayloadSignatureComputedFormat | undefined) {
  return format === "jws" ? transactionEncodedFormat.base64 : transactionEncodedFormat.raw;
}

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

    // Leave the deprecated warning and don't update to `subarray` method as
    // the output on LLM will not be the expected one (cf. LIVE-10430)
    switch (this.transactionType) {
      case ExchangeTypes.Sell:
      case ExchangeTypes.Fund:
        return result.slice(0, 32).toString("base64");
      case ExchangeTypes.Swap:
        return result.toString("ascii", 0, 10);
      default:
        return result.slice(0, 32).toString("hex");
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

    let p2Value = this.transactionType | P2_NONE;
    let bufferToSend: Buffer;
    if (this.isExchangeTypeNg()) {
      const encodedFormat = computedFormatToEncodedFormat(compFormat);

      // In JWS we expect the transaction to be in the following form: "." + base64Url(payload)
      // However, app-exchange doesn't expect the leading dot (i.e. ".")
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
        bufferToSend = await this.processSplitTransaction(bufferToSend);
        p2Value = this.transactionType | P2_EXTEND;
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
      p2Value,
      bufferToSend,
      this.allowedStatuses,
    );
    maybeThrowProtocolError(result);
  }

  /**
   *
   * @param bufferToSend Remaining buffer to send
   */
  private async processSplitTransaction(bufferToSend: Buffer): Promise<Buffer> {
    const dataLength = bufferToSend.length;

    for (let i = 0; i < Math.floor(dataLength / 256); i++) {
      const start = 255 * i;
      const end = start + 255;
      const data = bufferToSend.subarray(start, end);

      const extFlag = i == 0 ? P2_MORE : P2_MORE | P2_EXTEND;

      const result = await this.transport.send(
        0xe0,
        PROCESS_TRANSACTION_RESPONSE,
        this.transactionRate,
        this.transactionType | extFlag,
        data,
        this.allowedStatuses,
      );
      maybeThrowProtocolError(result);
    }

    return bufferToSend.subarray(dataLength - (dataLength % 255));
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
    return isExchangeTypeNg(this.transactionType);
  }
}
