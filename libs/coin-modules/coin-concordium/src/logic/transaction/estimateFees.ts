import { log } from "@ledgerhq/logs";
import { memoEncodedSize } from "@ledgerhq/concordium-core";
import { CONCORDIUM_ENERGY } from "../../constants";
import { getTransactionCost } from "../../network/proxyClient";

export interface FeeEstimation {
  cost: bigint;
  energy: bigint;
}

export async function estimateFees(currencyId: string, memo?: string): Promise<FeeEstimation> {
  try {
    const result = await getTransactionCost(currencyId, {
      numSignatures: 1,
      ...(memo ? { memoSize: memoEncodedSize(memo) } : {}),
    });

    return {
      cost: BigInt(result.cost),
      energy: BigInt(result.energy),
    };
  } catch (error) {
    log("concordium", "estimateFees error", { error });

    return {
      cost: CONCORDIUM_ENERGY.DEFAULT_COST,
      energy: memo ? CONCORDIUM_ENERGY.TRANSFER_WITH_MEMO_MAX : CONCORDIUM_ENERGY.DEFAULT,
    };
  }
}
