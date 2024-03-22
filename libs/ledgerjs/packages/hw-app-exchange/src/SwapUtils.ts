import protobuf from "protobufjs";
import * as protoJson from "./generate-protocol.json";

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

export async function decodePayloadProtobuf(hexBinaryPayload: string): Promise<SwapPayload> {
  const buffer = Buffer.from(hexBinaryPayload, "hex");
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
  const amountToWalletHexString = amountToWalletBuffer.toString("hex"); // Gets the hexadecimal representation from the Buffer
  const amountToWallet = BigInt("0x" + amountToWalletHexString); // Convert hexadecimal representation to a big integer

  const amountToProviderHexString = amountToProviderBuffer.toString("hex"); // Gets the hexadecimal representation from the Buffer
  const amountToProvider = BigInt("0x" + amountToProviderHexString); // Convert hexadecimal representation to a big integer

  const deviceTransactionIdNg = deviceTransactionIdNgBuffer?.toString("hex") || undefined;

  return { ...decodePayload, amountToWallet, amountToProvider, deviceTransactionIdNg };
}
