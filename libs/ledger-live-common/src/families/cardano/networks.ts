import type { CardanoLikeNetworkParameters } from "./types";

export const getNetworkParameters = (networkName: string): CardanoLikeNetworkParameters => {
  if (networkName === "cardano") {
    return {
      identifier: "cardano",
      networkId: 1,
      chainStartTime: 1506203091000,
      byronSlotDuration: 20000,
      byronSlotsPerEpoch: 21600,
      shelleyStartEpoch: 208,
      shelleySlotDuration: 1000,
      shelleySlotsPerEpoch: 432000,
      addressPrefix: "addr",
      poolIdPrefix: "pool",
    };
  } else if (networkName === "cardano_testnet") {
    return {
      identifier: "cardano_testnet",
      networkId: 0,
      chainStartTime: 1563999616000,
      byronSlotDuration: 20000,
      byronSlotsPerEpoch: 21600,
      shelleyStartEpoch: 74,
      shelleySlotDuration: 1000,
      shelleySlotsPerEpoch: 432000,
      addressPrefix: "addr_test",
      poolIdPrefix: "pool",
    };
  }

  throw new Error("No network parameters set for " + networkName);
};
