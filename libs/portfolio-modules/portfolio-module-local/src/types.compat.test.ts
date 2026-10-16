import type { JsonOperation } from "@ledgerhq/account-module-framework";
import type { AccountInfo, AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type {
  AccountInfoView,
  AssetInfoView,
  ChainAssetView,
  JsonValue,
  OperationView,
  TransactionInfoView,
  UtxoView,
} from "@ledgerhq/portfolio-module-framework";
import type { AccountUtxo, TransactionInfo } from "./types";

/**
 * Compile-time checks: each portfolio view is exactly the JSON form of what local answers it from,
 * so a drift on either side fails the typecheck. Assignable both ways, and the same keys (an
 * optional field added on one side only is assignable both ways).
 */

/** What `toJsonSafe` makes of a value of type `T`: bigints and dates as strings. */
type JsonForm<T> = unknown extends T
  ? JsonValue
  : T extends bigint | Date
    ? string
    : T extends string | number | boolean | null
      ? T
      : T extends readonly (infer Item)[]
        ? JsonForm<Item>[]
        : T extends object
          ? { [Key in keyof T]: JsonForm<T[Key]> }
          : never;

/** `A` and `B` are assignable to each other. */
type Both<A extends B, B extends C, C = A> = [A, B, C];

/** Every key of every member of `T`. */
type AllKeys<T> = T extends unknown ? keyof T : never;
type SameKeys<A, B> = [AllKeys<A>] extends [AllKeys<B>]
  ? [AllKeys<B>] extends [AllKeys<A>]
    ? true
    : false
  : false;
type True<T extends true> = T;

export type Checks = [
  Both<OperationView, JsonOperation>,
  True<SameKeys<OperationView, JsonOperation>>,
  Both<UtxoView, JsonForm<AccountUtxo>>,
  True<SameKeys<UtxoView, JsonForm<AccountUtxo>>>,
  Both<AssetInfoView, AssetInfo>,
  True<SameKeys<AssetInfoView, AssetInfo>>,
  Both<ChainAssetView, AssetInfo>,
  // Both open (an index signature): assignability is the whole check.
  Both<AccountInfoView, JsonForm<AccountInfo>>,
  Both<TransactionInfoView, JsonForm<TransactionInfo>>,
  True<SameKeys<TransactionInfoView, JsonForm<TransactionInfo>>>,
];

describe("portfolio views", () => {
  it("are the JSON form of what local answers them from (checked at compile time)", () => {
    const checks: Checks | undefined = undefined;

    expect(checks).toBeUndefined();
  });
});
