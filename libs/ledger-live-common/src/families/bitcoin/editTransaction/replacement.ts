import type { Account } from "@ledgerhq/types-live";
import {
  REPLACE_SPEEDUP,
  type BitcoinFeeParameters,
  type BitcoinTxData,
} from "@ledgerhq/coin-bitcoin/api";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import { getCoinModuleApi } from "../../../bridge/generic-coin-framework/api";
import { buildContext } from "../../../bridge/generic-coin-framework/api/context";
import { toWalletDerivationMode } from "../accountLayer/derivation";
import { conflictingTxIds } from "../accountLayer/selection";

/**
 * What the network says about a pending transaction to replace: its inputs and outputs, its fee and
 * rate, and the minimum a replacement pays — the replacement estimation of the coin module, with
 * the other pending transactions of the account it conflicts with, as the build counts them.
 */
export async function getReplacementEstimate(
  account: Account,
  txid: string,
): Promise<Partial<BitcoinFeeParameters>> {
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
        derivationMode: toWalletDerivationMode(account.derivationMode),
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
