import { AleoCoinConfig } from "../../config";
import { feesByTransactionType, ESTIMATED_FEE_SAFETY_RATE } from "../../constants";

export const getMockedConfig = (overrides?: Partial<AleoCoinConfig>): AleoCoinConfig => ({
  networkType: "testnet",
  apiUrls: {
    node: "https://api.provable.com/v2/testnet",
    sdk: "https://api.provable.com/v2/testnet",
  },
  status: {
    type: "active",
  },
  feesByTransactionType,
  estimatedFeeSafetyRate: ESTIMATED_FEE_SAFETY_RATE,
  ...overrides,
});
