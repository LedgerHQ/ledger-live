import type { Account } from "@ledgerhq/types-live";
import {
  REPLACE_SPEEDUP,
  toBitcoinDerivationMode,
  type BitcoinFeeParameters,
  type BitcoinTxData,
} from "@ledgerhq/coin-bitcoin/api";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import { getCoinModuleApi } from "../../../bridge/generic-coin-framework/api";
import { buildContext } from "../../../bridge/generic-coin-framework/api/context";
import {
  bitcoinWritePortfolioOf,
  conflictingTxIds,
  type BitcoinWritePortfolio,
} from "../accountModule/account";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** A decimal string (or number) of the JSON form back to a bigint; anything else as it is. */
const toBigInt = (value: unknown): unknown =>
  typeof value === "string" || typeof value === "number" ? BigInt(value) : value;

const AMOUNT_FIELDS = [
  "feePerByte",
  "relayFeePerByte",
  "amount",
  "minReplacementFee",
  "originalFeePerByte",
  "originalFee",
  "minReplacementFeePerByte",
] as const;

const VALUED_LISTS = ["inputs", "outputs", "replacedInputs", "replacedOutputs"] as const;

/**
 * The fee parameters of a bitcoin estimate, from the JSON form the portfolio answers them in: the
 * amounts, fee rates and input or output values back to bigints.
 */
export function fromJsonFeeParameters(json: unknown): Partial<BitcoinFeeParameters> {
  if (!isRecord(json)) return {};
  const parameters: Record<string, unknown> = { ...json };
  for (const field of AMOUNT_FIELDS) {
    if (field in json) parameters[field] = toBigInt(json[field]);
  }
  if (isRecord(json.feeRates)) {
    parameters.feeRates = Object.fromEntries(
      Object.entries(json.feeRates).map(([strategy, rate]) => [strategy, toBigInt(rate)]),
    );
  }
  for (const list of VALUED_LISTS) {
    const items = json[list];
    if (Array.isArray(items)) {
      parameters[list] = items.map(item =>
        isRecord(item) ? { ...item, value: toBigInt(item.value) } : item,
      );
    }
  }
  return parameters as Partial<BitcoinFeeParameters>;
}

/**
 * The replacement estimate through the portfolio: the account module completes the replacement
 * from `replaceTxId` (the inputs it spends again, the account's pending transactions it conflicts
 * with) and the coin module prices it.
 */
async function portfolioReplacementEstimate(
  { portfolio, network, key }: BitcoinWritePortfolio,
  txid: string,
): Promise<Partial<BitcoinFeeParameters>> {
  const { parameters } = await portfolio.estimateTransactionFee(network, {
    intent: {
      type: REPLACE_SPEEDUP,
      sender: key,
      amount: "0",
      asset: "native",
      networkParams: {
        accountOptions: { replaceTxId: txid },
        feeParameters: { feesStrategy: "fast" },
      },
    },
  });
  return fromJsonFeeParameters(parameters);
}

/**
 * What the network says about a pending transaction to replace: its inputs and outputs, its fee and
 * rate, and the minimum a replacement pays — the replacement estimation of the coin module, with
 * the other pending transactions of the account it conflicts with, as the build counts them.
 * Through the portfolio when the coin config of the currency enables it (`opened`: see
 * `getNextChangeAddress`).
 */
export async function getReplacementEstimate(
  account: Account,
  txid: string,
  opened?: BitcoinWritePortfolio | null,
): Promise<Partial<BitcoinFeeParameters>> {
  const served = opened === undefined ? await bitcoinWritePortfolioOf(account) : opened;
  if (served) return portfolioReplacementEstimate(served, txid);

  const api = await getCoinModuleApi(account.currency.id, "local");
  const context = buildContext(account.currency.id);
  const estimate = async (
    replacement: NonNullable<BitcoinTxData["replacement"]>,
  ): Promise<Partial<BitcoinFeeParameters>> => {
    const intent: TransactionIntent<any, BitcoinTxData> = {
      intentType: "transaction",
      type: REPLACE_SPEEDUP,
      sender: account.freshAddress,
      recipient: "",
      amount: 0n,
      asset: { type: "native" },
      data: {
        type: "bitcoin",
        derivationMode: toBitcoinDerivationMode(account.derivationMode),
        replacement,
      },
    };
    const { parameters } = await api.estimateFees(context, intent, {
      customFeesParameters: { feesStrategy: "fast" },
    });
    return (parameters ?? {}) as Partial<BitcoinFeeParameters>;
  };

  const replaced = await estimate({ txid });
  const outpoints = new Set(
    (replaced.replacedInputs ?? []).map(input => `${input.txid}-${input.vout}`),
  );
  const conflicts = conflictingTxIds(account, txid, outpoints);
  return conflicts.length ? estimate({ txid, conflictingTxIds: conflicts }) : replaced;
}
