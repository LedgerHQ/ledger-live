import protobuf from "protobufjs";
import * as protoJson from "./generate-protocol.json";
import { isHexadecimal } from "./shared-utils";

export type SellPayload = {
  deviceTransactionId: object;
  inAddress: string;
  inAmount: object;
  inCurrency: string;
  outAmount: object;
  outCurrency: string;
  traderEmail: string;
};

export async function decodeSellPayload(payload: string): Promise<SellPayload> {
  const buffer = isHexadecimal(payload)
    ? Buffer.from(payload, "hex")
    : Buffer.from(payload, "base64");

  const root: { [key: string]: any } = protobuf.Root.fromJSON(protoJson) || {};

  const TransactionResponse = root?.nested.ledger_swap?.NewSellResponse;
  const err = TransactionResponse.verify(buffer);

  if (err) {
    throw Error(err);
  }

  const decodedPayload = TransactionResponse.decode(buffer);

  return {
    ...decodedPayload,
  };
}
