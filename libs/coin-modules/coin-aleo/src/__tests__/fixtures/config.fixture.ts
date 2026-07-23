import { TRANSACTION_TYPE } from "../../constants";
import type { AleoCoinConfig, TransactionType } from "../../types";

export const mockFeeByTransactionType: Record<TransactionType, number> = {
  [TRANSACTION_TYPE.TRANSFER_PUBLIC]: 34060,
  [TRANSACTION_TYPE.TRANSFER_PRIVATE]: 2308,
  [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: 17972,
  [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: 18494,
  [TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC]: 34060,
  [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE]: 2308,
  [TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC]: 18494,
  [TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE]: 17972,
};

export const getMockedConfig = (networkType: "mainnet" | "testnet"): AleoCoinConfig => {
  return {
    networkType,
    apiUrls: {
      node: "https://node.example.com",
      sdk: "https://sdk.example.com",
    },
    feeByTransactionType: mockFeeByTransactionType,
    feeSafetyMultiplier: 1,
    isFeeSponsored: true,
    enableTokens: false,
    useEncryptedProve: false,
    recordPickingStrategy: "manual",
    status: { type: "active" },
  };
};
