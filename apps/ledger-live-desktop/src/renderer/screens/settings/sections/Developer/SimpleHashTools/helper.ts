import { SUPPORTED_BLOCKCHAINS_LIVE } from "@ledgerhq/live-nft/supported";

export const createOptions = () => {
  return SUPPORTED_BLOCKCHAINS_LIVE.map(blockchain => ({
    label: blockchain.charAt(0).toUpperCase() + blockchain.slice(1), // Capitalize first letter
    value: blockchain,
  }));
};
