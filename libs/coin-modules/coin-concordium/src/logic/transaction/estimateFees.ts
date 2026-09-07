import { log } from "@ledgerhq/logs";
import { memoEncodedSize } from "@ledgerhq/concordium-core";
import { CONCORDIUM_ENERGY, PLT_ENERGY_BUFFER_PERCENT } from "../../constants";
import { getTransactionCost } from "../../network/proxyClient";
import type { ConcordiumCoinConfig } from "../../types";

export interface FeeEstimation {
  cost: bigint;
  energy: bigint;
}

export interface PltFeeParams {
  /** Priced by its UTF-8 byte length alone, so it must be the on-chain id verbatim. */
  tokenId: string;
  /** Byte length of the CBOR operations blob, which must already be encoded. */
  listOperationsSize: number;
}

/**
 * Applies {@link PLT_ENERGY_BUFFER_PERCENT}, rounding up.
 *
 * Rounding up rather than truncating keeps a small estimate from losing its
 * buffer entirely to integer division.
 */
export function applyEnergyBuffer(value: bigint): bigint {
  const scale = BigInt(100);
  return (value * (scale + PLT_ENERGY_BUFFER_PERCENT) + scale - BigInt(1)) / scale;
}

export async function estimateFees(
  config: ConcordiumCoinConfig,
  currencyId: string,
  memo?: string,
): Promise<FeeEstimation> {
  try {
    const result = await getTransactionCost(config, currencyId, {
      type: "simpleTransfer",
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

/**
 * Estimates the fee for a PLT transfer, buffered.
 *
 * Separate from {@link estimateFees} rather than a branch inside it, because the
 * CCD path's fixed-energy fallback has no PLT counterpart: the fee depends on
 * the token id's length and the blob's size, so there is no constant to
 * substitute.
 *
 * The rejection propagates through `prepareTransaction`, which the send flow
 * surfaces and retries with backoff. Catching it to leave the fee unset defeats
 * that retry, and a cleared fee reads as a blocking validation error rather than
 * a pending one — a user who stopped typing during a proxy blip would stay stuck.
 */
export async function estimateTokenFees(
  config: ConcordiumCoinConfig,
  currencyId: string,
  { tokenId, listOperationsSize }: PltFeeParams,
): Promise<FeeEstimation> {
  const result = await getTransactionCost(config, currencyId, {
    type: "tokenUpdate",
    numSignatures: 1,
    tokenId,
    listOperationsSize,
    tokenOperationTypeCount: { transfer: 1 },
  });

  return {
    cost: applyEnergyBuffer(BigInt(result.cost)),
    energy: applyEnergyBuffer(BigInt(result.energy)),
  };
}
