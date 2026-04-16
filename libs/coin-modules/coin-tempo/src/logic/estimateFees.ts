import BigNumber from "bignumber.js";
import { estimateGas } from "../network/node";

/**
 * Fixed base fee on Tempo: 20 billion attodollars per gas unit.
 * Fee formula: ceil(gas_price * gas_used / 10^12) microdollars.
 *
 * gas_price = 20_000_000_000 (20B attodollars/gas)
 * fee = ceil(20_000_000_000 * gas_used / 10^12) microdollars
 *
 * pathUSD has 6 decimals, so 1 pathUSD = 1_000_000 microdollars.
 */

const BASE_FEE_ATTODOLLARS = new BigNumber("20000000000"); // 20B attodollars/gas
const ATTODOLLARS_TO_MICRODOLLARS = new BigNumber("1000000000000"); // 10^12

// Default gas estimate for a simple TIP-20 transfer
const DEFAULT_GAS_ESTIMATE = 65000;

export async function estimateFees(
  from: string,
  to: string,
  data?: string,
): Promise<BigNumber> {
  let gasUsed: number;

  try {
    gasUsed = await estimateGas(from, to, data);
  } catch {
    // Fallback to default gas for a simple transfer
    gasUsed = DEFAULT_GAS_ESTIMATE;
  }

  // fee = ceil(base_fee * gas_used / 10^12) in microdollars
  const feeInMicrodollars = BASE_FEE_ATTODOLLARS.times(gasUsed)
    .dividedBy(ATTODOLLARS_TO_MICRODOLLARS)
    .integerValue(BigNumber.ROUND_CEIL);

  return feeInMicrodollars;
}
