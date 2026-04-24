import {
  TransactionIntent,
  MemoNotSupported,
  BufferTxData,
} from "@ledgerhq/coin-module-framework/api/types";
import { getCallData } from "./common";

export function craftTransactionData(
  intent: TransactionIntent<MemoNotSupported, BufferTxData>,
): BufferTxData {
  return {
    value: getCallData(intent),
    type: "buffer",
  };
}
