import { AleoCoinConfig } from "../../config";
import { TRANSACTION_TYPE } from "../../constants";

export const getMockedConfig = (networkType: "mainnet" | "testnet"): AleoCoinConfig => {
  return {
    networkType,
    apiUrls: {
      node: "https://node.example.com",
      sdk: "https://sdk.example.com",
    },
    feeByTransactionType: {
      [TRANSACTION_TYPE.TRANSFER_PUBLIC]: 34060,
      [TRANSACTION_TYPE.TRANSFER_PRIVATE]: 2308,
      [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: 17972,
      [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: 18494,
    },
    feeSafetyMultiplier: 1,
    status: { type: "active" },
  };
};
