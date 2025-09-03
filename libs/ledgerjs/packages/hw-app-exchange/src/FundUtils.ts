import protobuf from "protobufjs";
import * as protoJson from "./generate-protocol.json";
import { isHexadecimal } from "./shared-utils";

export type FundPayload = {
  deviceTransactionId: object;
  inAddress: string;
  inAmount: object;
  inCurrency: string;
  accountName: string;
  userId: string;
  payinExtraId?: string;
};

export async function decodeFundPayload(payload: string): Promise<FundPayload> {
  const buffer = isHexadecimal(payload)
    ? Buffer.from(payload, "hex")
    : Buffer.from(payload, "base64");

  const root: { [key: string]: any } = protobuf.Root.fromJSON(protoJson) || {};

  const TransactionResponse = root?.nested.ledger_swap?.NewFundResponse;
  const err = TransactionResponse.verify(buffer);

  if (err) {
    throw Error(err);
  }

  const decodedPayload = TransactionResponse.decode(buffer);

  return {
    ...decodedPayload,
  };
}
