const DEFAULT_CALLDATA_FLOOR_GAS_PER_TOKEN = 10n;
const DEFAULT_CALLDATA_FLOOR_ZERO_BYTE_TOKENS = 1n;
const NON_ZERO_BYTE_TOKENS = 4n;

const INTRINSIC_ZERO_BYTE_GAS = 4n;
const INTRINSIC_NON_ZERO_BYTE_GAS = 16n;

/** Values come from remote config, where a float or a NaN would otherwise throw in `BigInt()`. */
function toPositiveInteger(value: number | undefined, fallback: bigint): bigint {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return fallback;
  }
  return BigInt(value);
}

export type CalldataFloorParams = {
  gasPerToken?: number | undefined;
  zeroByteTokens?: number | undefined;
};

/**
 * Compute the calldata floor gas limit.
 *
 * Defaults to https://eips.ethereum.org/EIPS/eip-7623 (10/40 gas per zero/non-zero byte).
 * https://eips.ethereum.org/EIPS/eip-7976 raises it to 64/64 via `gasPerToken: 16` **and**
 * `zeroByteTokens: 4` — 64 is the resulting gas per byte, not a value to pass here.
 *
 * Returns `max(intrinsic, floor)` as the EIP specifies. The floor is the larger one for every
 * parameter set we intend to configure, but taking the max keeps a misconfigured remote value from
 * dropping the result below intrinsic gas.
 */
export function computeEIP7623GasLimit(
  defaultGasLimit: bigint,
  callData: Buffer,
  params: CalldataFloorParams = {},
): bigint {
  const gasPerToken = toPositiveInteger(params.gasPerToken, DEFAULT_CALLDATA_FLOOR_GAS_PER_TOKEN);
  const zeroByteTokens = toPositiveInteger(
    params.zeroByteTokens,
    DEFAULT_CALLDATA_FLOOR_ZERO_BYTE_TOKENS,
  );

  let tokensInCalldata = 0n;
  let intrinsicCalldataGas = 0n;
  for (const byte of callData) {
    tokensInCalldata += byte === 0 ? zeroByteTokens : NON_ZERO_BYTE_TOKENS;
    intrinsicCalldataGas += byte === 0 ? INTRINSIC_ZERO_BYTE_GAS : INTRINSIC_NON_ZERO_BYTE_GAS;
  }
  const floorCalldataGas = gasPerToken * tokensInCalldata;

  return (
    defaultGasLimit +
    (floorCalldataGas > intrinsicCalldataGas ? floorCalldataGas : intrinsicCalldataGas)
  );
}
