import type { AccountIntent, CoinIntent } from "@ledgerhq/account-module-framework";
import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/types";
import {
  assetKeyOf,
  PortfolioApiError,
  type TransactionIntentView,
} from "@ledgerhq/portfolio-module-framework";
import type { LocalNetwork } from "./types";

/**
 * The `networkParams` key carrying the fee parameters of a client (`customFeesParameters` of an
 * estimate, `customFees.parameters` of a craft or a validation). They reach the modules as fee
 * options, never as fields of the intent.
 */
const FEE_PARAMETERS_KEY = "feeParameters";

const INTENT_TYPES: ReadonlySet<unknown> = new Set(["transaction", "staking"]);

/** A decimal string of base units; BAD_REQUEST otherwise. */
export function parseAmount(value: string, field: string): bigint {
  try {
    return BigInt(value);
  } catch {
    throw new PortfolioApiError("BAD_REQUEST", `Invalid ${field} ${value}`);
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const networkParamsOf = ({ networkParams }: TransactionIntentView): Record<string, unknown> =>
  isRecord(networkParams) ? networkParams : {};

/** "transaction" when absent; BAD_REQUEST on any other value than the two. */
export function intentTypeOf({ intentType }: TransactionIntentView): "transaction" | "staking" {
  if (intentType === undefined) return "transaction";
  if (!INTENT_TYPES.has(intentType)) {
    throw new PortfolioApiError("BAD_REQUEST", `Invalid intentType ${String(intentType)}`);
  }
  return intentType;
}

/**
 * The asset of the coin intent: `assetInfo`, whose key must be `asset` (BAD_REQUEST otherwise);
 * the native asset for "native" or no asset; for any other key without `assetInfo`, the one sender
 * balance with that key (BAD_REQUEST when none or several). Never a generic token: Tron, Hedera and
 * Stellar would sign a native transfer.
 */
export function intentAssetOf(view: TransactionIntentView, senderBalances: Balance[]): AssetInfo {
  const key = view.asset ?? "native";
  if (view.assetInfo) {
    if (assetKeyOf(view.assetInfo) !== key) {
      throw new PortfolioApiError(
        "BAD_REQUEST",
        `assetInfo is keyed ${assetKeyOf(view.assetInfo)}, not ${key}`,
      );
    }
    return view.assetInfo;
  }
  if (key === "native") return { type: "native" };
  const held = senderBalances.filter(({ asset }) => assetKeyOf(asset) === key);
  if (held.length !== 1) {
    throw new PortfolioApiError(
      "BAD_REQUEST",
      `Asset ${key} needs an assetInfo: the sender holds ${held.length} balances of it`,
    );
  }
  return held[0].asset;
}

/**
 * The coin module intent of a service intent. An object `networkParams` is spread into it first,
 * as sent: it carries what a network needs beyond the common fields (data, memo, useAllAmount,
 * sequence, mode, valAddress...), and the common fields win over it. Its fee parameters are left
 * out. `completeData` (a coin sender only) fills an undefined `data` with the coin module's
 * `craftTransactionData`, as a client does when its family builds none.
 */
export function toCoinIntent(
  view: TransactionIntentView,
  network: LocalNetwork,
  senderBalances: Balance[] = [],
  { completeData = false }: { completeData?: boolean } = {},
): CoinIntent {
  const { [FEE_PARAMETERS_KEY]: _feeParameters, ...networkParams } = networkParamsOf(view);
  const intent: CoinIntent = {
    ...networkParams,
    intentType: intentTypeOf(view),
    type: view.type,
    sender: view.sender,
    recipient: view.recipient ?? "",
    amount: parseAmount(view.amount ?? "0", "amount"),
    asset: intentAssetOf(view, senderBalances),
    ...(view.senderPublicKey === undefined ? {} : { senderPublicKey: view.senderPublicKey }),
    ...(view.feesStrategy === undefined ? {} : { feesStrategy: view.feesStrategy }),
  };
  // `=== undefined`, not `in`: a client leaving `data` to the writer may send the key undefined.
  return completeData && (intent as { data?: unknown }).data === undefined
    ? { ...intent, data: network.coinModule.craftTransactionData(network.context, intent) }
    : intent;
}

/** The account module intent: no sender (the module derives it), `data` left to the module. */
export function toAccountIntent(
  view: TransactionIntentView,
  network: LocalNetwork,
  senderBalances: Balance[],
): AccountIntent {
  const { sender: _sender, ...intent } = toCoinIntent(view, network, senderBalances);
  return intent;
}

/**
 * The fee parameters the modules receive, presence exact: an object `networkParams.feeParameters`
 * (even empty) over the intent's fees strategy; undefined without either.
 */
export function feeParametersOf(view: TransactionIntentView): Record<string, unknown> | undefined {
  const carried = networkParamsOf(view)[FEE_PARAMETERS_KEY];
  if (!isRecord(carried) && view.feesStrategy === undefined) return undefined;
  return {
    ...(view.feesStrategy === undefined ? {} : { feesStrategy: view.feesStrategy }),
    ...(isRecord(carried) ? carried : {}),
  };
}
