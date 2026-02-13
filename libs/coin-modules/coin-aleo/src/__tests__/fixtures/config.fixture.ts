import { AleoCoinConfig } from "../../config";

export const getMockedConfig = (networkType: "mainnet" | "testnet"): AleoCoinConfig => {
  return {
    networkType,
    apiUrls: {
      node: "https://node.example.com",
      sdk: "https://sdk.example.com",
    },
    status: { type: "active" },
  };
};
