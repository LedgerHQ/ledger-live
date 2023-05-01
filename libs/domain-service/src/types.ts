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

interface PromiseResolution<T> {
  status: "fulfilled";
  value: T;
}
interface PromiseRejection<E> {
  status: "rejected";
  reason: E;
}
export type PromiseResult<T, E = unknown> =
  | PromiseResolution<T>
  | PromiseRejection<E>;

export { SupportedRegistries, DomainServiceResolution };
