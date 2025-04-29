import { getEnv } from "@ledgerhq/live-env";
export const createOptions = () => {
  return getEnv("NFT_CURRENCIES").map(blockchain => ({
    label: blockchain.charAt(0).toUpperCase() + blockchain.slice(1), // Capitalize first letter
    value: blockchain,
  }));
};
