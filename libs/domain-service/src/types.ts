import { CoinType } from "@ledgerhq/types-cryptoassets";

export type SupportedRegistries = "ens";

export type Registry = {
  name: SupportedRegistries;
  resolvers: {
    forward: string;
    reverse: string;
  };
  signatures: {
    forward: string;
    reverse: string;
  };
  patterns: {
    forward: RegExp;
    reverse: RegExp;
  };
  coinTypes: CoinType[];
};
