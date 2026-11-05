import type { TransactionIntent, TxData } from "@ledgerhq/coin-module-framework/api/types";
import { InvalidUtxoId, InvalidUtxoStrategy, OpReturnDataSizeLimit } from "../errors";
import { outpoint } from "./getSpendableUtxos";
import type { ICrypto, UtxoStrategyName } from "./selectUtxos";
import { OP_RETURN_DATA_SIZE_LIMIT, UTXO_STRATEGIES } from "./selectUtxos";

/**
 * Bitcoin-specific transaction fields, carried in the intent's `data` (the framework's `TxData`
 * slot), as coin-evm carries calldata. `type` is `"unknown"`: the data is not one encoded
 * payload but a set of optional fields (OP_RETURN data, coin control). Every field is optional:
 * an intent without `data` is a plain payment.
 */
export interface BitcoinTxData extends TxData {
  type: "unknown";
  /**
   * Data of an OP_RETURN output, hex (e.g. a swap provider's memo). JSON-safe on purpose: the
   * generic bridge stores the intent data as JSON.
   */
  opReturnData?: string;
  /** How the outputs a transaction spends are chosen. UTXO ids are the ids `listHoldings` returns, "txid:vout". */
  utxoStrategy?: {
    /** Order in which outputs are added. Default: deep outputs first, as the bridge. */
    strategy?: UtxoStrategyName;
    /** Outputs never spent. */
    excludedUtxos?: string[];
    /** Outputs always spent, and the only ones spent: nothing is added to them. */
    selectedUtxos?: string[];
  };
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

/** An output, as `listHoldings` identifies it. */
export type OutputRef = { hash: string; outputIndex: number };

/** How an intent chooses the outputs it spends, with the UTXO ids parsed. */
export type CoinControl = {
  strategy: UtxoStrategyName;
  selected: OutputRef[];
  excluded: OutputRef[];
};

const UTXO_ID = /^([0-9a-fA-F]{64}):(0|[1-9][0-9]*)$/;

function parseUtxoIds(ids: unknown): OutputRef[] {
  if (ids === undefined) return [];
  if (!Array.isArray(ids)) throw new InvalidUtxoId("UTXO ids must be a list");
  const refs = ids.map(id => {
    const match = typeof id === "string" ? UTXO_ID.exec(id) : null;
    const outputIndex = match ? Number(match[2]) : NaN;
    if (!match || !Number.isSafeInteger(outputIndex)) {
      throw new InvalidUtxoId(`invalid UTXO id ${String(id)}, expected "txid:vout"`, {
        utxoId: id,
      });
    }
    return { hash: match[1].toLowerCase(), outputIndex };
  });
  const seen = new Set<string>();
  for (const ref of refs) {
    const utxoId = outpoint(ref.hash, ref.outputIndex);
    if (seen.has(utxoId)) throw new InvalidUtxoId(`UTXO ${utxoId} is listed twice`, { utxoId });
    seen.add(utxoId);
  }
  return refs;
}

/**
 * The coin control of the intent (`data.utxoStrategy`), UTXO ids parsed. Throws
 * `InvalidUtxoId` for an id that is not "txid:vout" or that is listed twice in a list or both selected and excluded, and
 * `InvalidUtxoStrategy` for an unknown strategy.
 */
export function coinControlOf(intent: BitcoinIntent): CoinControl {
  const control = intent.data?.utxoStrategy;
  const strategy = control?.strategy ?? "deep-outputs-first";
  if (!UTXO_STRATEGIES.includes(strategy)) {
    throw new InvalidUtxoStrategy(`unknown utxo strategy ${String(strategy)}`, { strategy });
  }
  const selected = parseUtxoIds(control?.selectedUtxos);
  const excluded = parseUtxoIds(control?.excludedUtxos);
  const excludedIds = new Set(excluded.map(ref => outpoint(ref.hash, ref.outputIndex)));
  const both = selected.find(ref => excludedIds.has(outpoint(ref.hash, ref.outputIndex)));
  if (both) {
    const utxoId = outpoint(both.hash, both.outputIndex);
    throw new InvalidUtxoId(`UTXO ${utxoId} is both selected and excluded`, { utxoId });
  }
  return { strategy, selected, excluded };
}
