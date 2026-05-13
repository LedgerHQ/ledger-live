import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type { AleoCoinConfig } from "@ledgerhq/live-common/families/aleo/types";

export const mockAleoCoinConfig: AleoCoinConfig = {
  status: { type: "active" },
  networkType: "mainnet",
  apiUrls: { node: "https://node.aleo.org", sdk: "https://sdk.aleo.org" },
  feeByTransactionType: {
    [TRANSACTION_TYPE.TRANSFER_PUBLIC]: 1000,
    [TRANSACTION_TYPE.TRANSFER_PRIVATE]: 2000,
    [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: 3000,
    [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: 4000,
  },
  feeSafetyMultiplier: 1,
  isFeeSponsored: true,
  useEncryptedProve: false,
  enableTokens: false,
  recordPickingStrategy: "manual",
};
