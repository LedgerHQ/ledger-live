import { AleoCoinConfig } from "../../config";

export const getMockedConfig = (overrides?: Partial<AleoCoinConfig>): AleoCoinConfig => ({
  networkType: "testnet",
  apiUrls: {
    node: "https://api.provable.com/v2/testnet",
    sdk: "https://api.provable.com/v2/testnet",
  },
  status: {
    type: "active",
  },
  ...overrides,
});
