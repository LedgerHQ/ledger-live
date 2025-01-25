export type UniswapSupportedCommand =
  | "V2_SWAP_EXACT_IN"
  | "V2_SWAP_EXACT_OUT"
  | "V3_SWAP_EXACT_IN"
  | "V3_SWAP_EXACT_OUT"
  | "WRAP_ETH"
  | "UNWRAP_ETH"
  | "PERMIT2_PERMIT"
  | "PERMIT2_TRANSFER_FROM"
  | "PERMIT2_PERMIT_BATCH"
  | "PERMIT2_TRANSFER_FROM_BATCH"
  | "PAY_PORTION"
  | "SWEEP";

export type CommandsAndTokens = [UniswapSupportedCommand | undefined, `0x${string}`[]][];
