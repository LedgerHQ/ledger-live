import { Transaction } from "../generated/types";

export * from "@ledgerhq/coin-framework/nft/support";

export const isNftTransaction = (transaction: Transaction | undefined | null): boolean => {
  if (transaction?.family === "ethereum") {
    return ["erc721.transfer", "erc1155.transfer"].includes(transaction?.mode);
  } else if (transaction?.family === "evm") {
    return ["erc721", "erc1155"].includes(transaction?.mode);
  }

  return false;
};
