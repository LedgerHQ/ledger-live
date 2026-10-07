import type { TransactionIntent, TxData } from "@ledgerhq/coin-module-framework/api/types";
import { OpReturnDataSizeLimit } from "../errors";
import { OP_RETURN_DATA_SIZE_LIMIT, type ICrypto } from "./selectUtxos";

/**
 * Bitcoin-specific transaction fields, carried in the intent's `data` (the framework's `TxData`
 * slot), as coin-evm carries calldata. Every field is optional: an intent without `data` is a plain
 * payment.
 */
export interface BitcoinTxData extends TxData {
  type: "bitcoin";
  /**
   * Data of an OP_RETURN output, hex (e.g. a swap provider's memo). JSON-safe on purpose: the
   * generic bridge stores the intent data as JSON.
   */
  opReturnData?: string;
}

/** An intent as the logic reads it: `data` may be absent, whatever the caller's typing. */
export type BitcoinIntent = TransactionIntent & { data?: BitcoinTxData };

const HEX = /^(?:[0-9a-fA-F]{2})*$/;

/**
 * The OP_RETURN output script of the intent, or `undefined` when it carries no data. Data that is
 * not hex is refused; data over the relay limit is refused with `OpReturnDataSizeLimit`, as the
 * bridge does.
 */
export function opReturnScript(intent: BitcoinIntent, crypto: ICrypto): Buffer | undefined {
  const data = intent.data?.opReturnData;
  if (data === undefined || data === "") return undefined;
  if (!HEX.test(data)) throw new Error("opReturnData must be hex");
  const bytes = Buffer.from(data, "hex");
  if (bytes.length > OP_RETURN_DATA_SIZE_LIMIT) throw new OpReturnDataSizeLimit();
  return crypto.toOpReturnOutputScript(bytes);
}
