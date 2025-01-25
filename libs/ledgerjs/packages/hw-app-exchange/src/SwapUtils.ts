import protobuf from "protobufjs";
import * as protoJson from "./generate-protocol.json";
import { isHexadecimal } from "./shared-utils";

type SwapProtobufPayload = {
  payinAddress: string;
  payinExtraId?: string;
  refundAddress: string;
  refundExtraId?: string;
  payoutAddress: string;
  payoutExtraId?: string;
  currencyFrom: string;
  currencyTo: string;
  amountToProvider: Buffer;
  amountToWallet: Buffer;
  message?: string;
  deviceTransactionId?: string;
  deviceTransactionIdNg?: Buffer;
};

export type SwapPayload = {
  payinAddress: string;
  payinExtraId?: string;
  refundAddress: string;
  refundExtraId?: string;
  payoutAddress: string;
  payoutExtraId?: string;
  currencyFrom: string;
  currencyTo: string;
  amountToProvider: bigint;
  amountToWallet: bigint;
  message?: string;
  deviceTransactionId?: string;
  deviceTransactionIdNg?: string;
};

/**
 * deprecated use `decodeSwapPayload` instead
 */
export const decodePayloadProtobuf = (payload: string): Promise<SwapPayload> =>
  decodeSwapPayload(payload);

export async function decodeSwapPayload(payload: string): Promise<SwapPayload> {
  const buffer = isHexadecimal(payload)
    ? Buffer.from(payload, "hex")
    : Buffer.from(payload, "base64");
  const root: { [key: string]: any } = protobuf.Root.fromJSON(protoJson) || {};
  const TransactionResponse = root?.nested.ledger_swap?.NewTransactionResponse;
  const err = TransactionResponse.verify(buffer);
  if (err) {
    throw Error(err);
  }
  const decodePayload = TransactionResponse.decode(buffer) as unknown as SwapProtobufPayload;
  const {
    amountToWallet: amountToWalletBuffer,
    amountToProvider: amountToProviderBuffer,
    deviceTransactionIdNg: deviceTransactionIdNgBuffer,
  } = decodePayload;
  const amountToWalletHexString = Buffer.from(amountToWalletBuffer).toString("hex"); // Gets the hexadecimal representation from the Buffer
  const amountToWallet = BigInt("0x" + amountToWalletHexString); // Convert hexadecimal representation to a big integer

  const amountToProviderHexString = Buffer.from(amountToProviderBuffer).toString("hex"); // Gets the hexadecimal representation from the Buffer
  const amountToProvider = BigInt("0x" + amountToProviderHexString); // Convert hexadecimal representation to a big integer

  const deviceTransactionIdNg = deviceTransactionIdNgBuffer?.toString("hex") || undefined;

  return { ...decodePayload, amountToWallet, amountToProvider, deviceTransactionIdNg };
}
