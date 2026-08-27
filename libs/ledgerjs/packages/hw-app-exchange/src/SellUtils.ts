import { ledger_trade } from "./generate-protocol";
import { isHexadecimal } from "./shared-utils";

export type SellPayload = {
  deviceTransactionId: Uint8Array;
  inAddress: string;
  inAmount: Uint8Array;
  inCurrency: string;
  outAmount?: ledger_trade.IUDecimal | null;
  outCurrency: string;
  traderEmail: string;
  inExtraId?: string;
};

export async function decodeSellPayload(payload: string): Promise<SellPayload> {
  const buffer = isHexadecimal(payload)
    ? Buffer.from(payload, "hex")
    : Buffer.from(payload, "base64");

  const SellResponse = ledger_trade.NewSellResponse;
  const decodedPayload = SellResponse.decode(buffer);
  const err = SellResponse.verify(decodedPayload);

  if (err) {
    throw Error(err);
  }

  return {
    ...decodedPayload,
  };
}
