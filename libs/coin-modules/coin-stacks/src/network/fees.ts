import { fetchFeeEstimateTransaction, fetchFeeEstimateTransfer } from "@stacks/transactions";

type TransactionFeeParams = Parameters<typeof fetchFeeEstimateTransaction>[0];

/**
 * Low tier of the byte-length fee estimate.
 * Ledger's Stacks proxy has no route for POST /v2/fees/transaction, so a 404 falls back to the
 * transfer fee rate (GET /v2/fees/transfer), which that proxy does serve.
 * The rate is applied to the estimated byte length of any payload, contract calls included, the
 * same fallback the SDK's own `fetchFeeEstimate` uses when the node has no estimate.
 * Remove the fallback once the proxy routes POST /v2/fees/transaction.
 */
export async function fetchLowTransactionFee(
  params: TransactionFeeParams & { estimatedLength: number },
): Promise<number> {
  try {
    const [lowFee] = await fetchFeeEstimateTransaction(params);
    return Math.round(lowFee.fee);
  } catch (error) {
    if (!isTransactionFeeRouteMissing(error)) throw error;
    const fee = await fetchFeeEstimateTransfer({
      transaction: params.estimatedLength,
      network: params.network,
      client: params.client,
    });
    return Number(fee);
  }
}

function isTransactionFeeRouteMissing(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("Response 404") &&
    error.message.includes("/v2/fees/transaction")
  );
}
