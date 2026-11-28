import type {
  BlockOperation,
  BlockTransaction,
  CoinModuleApi,
} from "@ledgerhq/coin-module-framework/api/index";
import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { isGoldToken } from "./goldToken";

type GetBlockFn<C extends CurrencyConfig> = CoinModuleApi<C>["getBlock"];

const toNativeOperation = (operation: BlockOperation): BlockOperation =>
  operation.type === "transfer" && isGoldToken(operation.asset)
    ? { ...operation, asset: { type: "native" } }
    : operation;

const withNativeOperations = (transaction: BlockTransaction): BlockTransaction => ({
  ...transaction,
  operations: transaction.operations.map(toNativeOperation),
});

/** Wraps coin-evm's `getBlock` to report GoldToken transfers as native CELO. */
export const makeGetBlock =
  <C extends CurrencyConfig>(baseGetBlock: GetBlockFn<C>): GetBlockFn<C> =>
  async (context, height) => {
    const block = await baseGetBlock(context, height);
    return { ...block, transactions: block.transactions.map(withNativeOperations) };
  };
