import type {
  TransactionIntent,
  MemoNotSupported,
} from "@ledgerhq/coin-module-framework/api/index";
import type { BitcoinTxData } from "./intent";

export function craftTransactionData(
  intent: TransactionIntent<MemoNotSupported, BitcoinTxData>,
): BitcoinTxData {
  return {
    type: "unknown",
    ...(intent.data?.opReturnData ? { opReturnData: intent.data.opReturnData } : {}),
    // Kept whenever present, even malformed, so that `coinControlOf` still refuses it.
    ...(intent.data?.utxoStrategy !== undefined ? { utxoStrategy: intent.data.utxoStrategy } : {}),
  };
}
