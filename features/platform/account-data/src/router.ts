import { NoAccountDataSourceError } from "./errors";
import type { AccountDataMethod, AccountDataSource, AccountRef } from "./source";

export type SourceWith<M extends AccountDataMethod> = AccountDataSource &
  Required<Pick<AccountDataSource, M>>;

export type AccountDataRouter = {
  resolve<M extends AccountDataMethod>(method: M, ref: AccountRef): SourceWith<M>;
};

const implements_ = <M extends AccountDataMethod>(
  source: AccountDataSource,
  method: M,
): source is SourceWith<M> => typeof source[method] === "function";

/** First source, in order, that supports the account and implements the method. */
export function createAccountDataRouter(sources: readonly AccountDataSource[]): AccountDataRouter {
  return {
    resolve(method, ref) {
      for (const source of sources) {
        if (source.supports(ref) && implements_(source, method)) return source;
      }
      throw new NoAccountDataSourceError(ref.accountId, method);
    },
  };
}
