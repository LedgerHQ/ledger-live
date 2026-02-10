import { fetchEstimatedFees } from "../network/api";
import { calculateEstimatedFees, Methods } from "./common";
import type { FilecoinFeeEstimation } from "../types/model";

/**
 * Estimate transaction fees for a Filecoin transaction.
 *
 * @param sender - The sender address
 * @param recipient - The recipient address (or contract address for token transfers)
 * @param amount - The amount to send
 * @param method - The transaction method (default: Transfer)
 * @param params - Encoded parameters (for ERC20 transfers)
 * @returns Fee estimation with gas parameters
 */
export async function estimateFees(
  sender: string,
  recipient: string,
  amount: bigint,
  method: number = Methods.Transfer,
  params?: string,
): Promise<FilecoinFeeEstimation> {
  const request: Parameters<typeof fetchEstimatedFees>[0] = {
    from: sender,
    to: recipient,
    methodNum: method,
    value: amount.toString(),
  };
  if (params !== undefined) {
    request.params = params;
  }
  const estimation = await fetchEstimatedFees(request);

  const value = calculateEstimatedFees(
    BigInt(estimation.gas_fee_cap),
    BigInt(estimation.gas_limit),
  );

  return {
    value,
    parameters: {
      gasFeeCap: BigInt(estimation.gas_fee_cap),
      gasPremium: BigInt(estimation.gas_premium),
      gasLimit: BigInt(estimation.gas_limit),
    },
  };
}

/**
 * Get the current nonce for an address.
 * Uses the fee estimation endpoint which returns the nonce.
 *
 * @param address - The address to get nonce for
 * @returns Current nonce as bigint
 */
export async function getSequence(address: string): Promise<bigint> {
  // Nonce is returned as part of fetchEstimatedFees response
  // Use a minimal fee estimation call to get the current nonce
  const estimation = await fetchEstimatedFees({
    from: address,
    to: address, // Self-transfer for nonce lookup
    methodNum: Methods.Transfer,
  });
  return BigInt(estimation.nonce ?? 0);
}
