import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const stacksConfig: Record<string, ConfigInfo> = {
  config_stacks_generic_bridge: {
    type: "boolean",
    default: true,
  },
  config_currency_stacks: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", status: "active" },
          { id: "staking_txs", status: "active" },
        ],
      },
      name: "Stacks",
      unit: { name: "STX", code: "STX", magnitude: 6 },
    },
  },
};
