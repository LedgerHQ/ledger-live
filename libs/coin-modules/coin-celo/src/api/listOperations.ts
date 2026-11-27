import type { CoinModuleApi, Operation } from "@ledgerhq/coin-module-framework/api/index";
import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { isGoldToken } from "./goldToken";

type ListOperationsFn<C extends CurrencyConfig> = CoinModuleApi<C>["listOperations"];

const TOKEN_ONLY_DETAILS = new Set([
  "ledgerOpType",
  "assetAmount",
  "assetSenders",
  "assetRecipients",
]);

const withoutTokenDetails = (details: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(details).filter(([key]) => !TOKEN_ONLY_DETAILS.has(key)));

const toNativeOperation = (operation: Operation): Operation =>
  isGoldToken(operation.asset)
    ? {
        ...operation,
        asset: { type: "native" },
        ...(operation.details && { details: withoutTokenDetails(operation.details) }),
      }
    : operation;

/** Wraps coin-evm's `listOperations` to report GoldToken transfers as native CELO. */
export const makeListOperations =
  <C extends CurrencyConfig>(baseListOperations: ListOperationsFn<C>): ListOperationsFn<C> =>
  async (context, address, options) => {
    const page = await baseListOperations(context, address, options);
    return { ...page, items: page.items.map(toNativeOperation) };
  };
