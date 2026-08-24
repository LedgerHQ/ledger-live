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
    [TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC]: 1000,
    [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE]: 2000,
    [TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE]: 3000,
    [TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC]: 4000,
    [TRANSACTION_TYPE.BOND_PUBLIC]: 34060,
    [TRANSACTION_TYPE.UNBOND_PUBLIC]: 34060,
    [TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC]: 34060,
  },
  feeSafetyMultiplier: 1,
  isFeeSponsored: true,
  useEncryptedProve: false,
  enableTokens: false,
  recordPickingStrategy: "manual",
};
