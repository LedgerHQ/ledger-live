import { AleoCoinConfig } from "../../config";

export const getMockedConfig = (overrides?: Partial<AleoCoinConfig>): AleoCoinConfig => ({
  networkType: "testnet",
  nodeUrl: "https://api.provable.com/v2/testnet",
  status: {
    type: "active",
  },
  ...overrides,
});
