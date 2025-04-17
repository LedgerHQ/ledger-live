import { Asset } from "@ledgerhq/coin-framework/api/types";

export type BoilerplateToken = {
  standard: "brc20" | "brc721";
  contractAddress: string;
};
export type BoilerplateAsset = Asset<BoilerplateToken>;
