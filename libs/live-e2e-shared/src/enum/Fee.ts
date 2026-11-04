export enum Fee {
  FAST = "Fast",
  MEDIUM = "Medium",
  SLOW = "Slow",
}

export const EIP1559_CUSTOM_FEES = {
  maxPriorityFee: "1",
  maxFee: "2",
  expectedNetworkFee: "0.000042",
} as const;
