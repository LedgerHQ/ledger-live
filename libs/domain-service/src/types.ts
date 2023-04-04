import { CoinType } from "@ledgerhq/types-cryptoassets";
import type {
  SupportedRegistries,
  DomainServiceResolution,
} from "@ledgerhq/types-live/lib/domain";

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

export { SupportedRegistries, DomainServiceResolution };
