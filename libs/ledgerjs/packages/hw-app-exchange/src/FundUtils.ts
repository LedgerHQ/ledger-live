import { ledger_trade } from "./generate-protocol";
import { isHexadecimal } from "./shared-utils";

export type FundPayload = {
  deviceTransactionId: Uint8Array;
  inAddress: string;
  inAmount: Uint8Array;
  inCurrency: string;
  accountName: string;
  userId: string;
  inExtraId?: string;
};

export async function decodeFundPayload(payload: string): Promise<FundPayload> {
  const buffer = isHexadecimal(payload)
    ? Buffer.from(payload, "hex")
    : Buffer.from(payload, "base64");

  const FundResponse = ledger_trade.NewFundResponse;
  const decodedPayload = FundResponse.decode(buffer);
  const err = FundResponse.verify(decodedPayload);

  if (err) {
    throw Error(err);
  }

  return {
    ...decodedPayload,
  };
}
