import type { CoinModuleImpl, MemoNotSupported } from "@ledgerhq/coin-module-framework/api/index";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type { BitcoinCoinConfig, BitcoinContext } from "../config";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getBalance } from "../logic/getBalance";
import { getBlock } from "../logic/getBlock";
import { getBlockInfo } from "../logic/getBlockInfo";
import type { BitcoinTxData } from "../logic/intent";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateIntent } from "../logic/validateIntent";

export type { BitcoinTxData } from "../logic/intent";
export type { PaymentTransactionParameters, SigningRequest } from "../logic/signingRequest";
export { paymentTransactionParameters } from "../logic/signingRequest";

/**
 * Stateless, single-address Coin Module API for one currency served by coin-bitcoin.
 *
 * The configuration is read on every call through `context.config(currencyId)`. Capabilities the
 * module does not have (staking, validators, raw crafting, …) are omitted: the consumer's
 * `withDefaults` answers them as not supported. Bitcoin-specific fields (OP_RETURN data) travel in
 * the intent's `data` ({@link BitcoinTxData}).
 */
export function createApi(currencyId: string) {
  return {
    getBalance: (context: BitcoinContext, address, options?) =>
      rejectBalanceOptions(() => getBalance(context, currencyId, address), options),
    lastBlock: (context: BitcoinContext) => lastBlock(context, currencyId),
    getBlockInfo: (context: BitcoinContext, height) => getBlockInfo(context, currencyId, height),
    getBlock: (context: BitcoinContext, height) => getBlock(context, currencyId, height),
    listOperations: (context: BitcoinContext, address, options) =>
      listOperations(context, currencyId, address, options),
    estimateFees: (context: BitcoinContext, intent, options?) =>
      estimateFees(context, currencyId, intent, options?.customFeesParameters),
    craftTransaction: (context: BitcoinContext, intent, options?) =>
      craftTransaction(context, currencyId, intent, options?.customFees),
    combine: (_context: BitcoinContext, tx, signature, options?) =>
      combine(currencyId, tx, signature, options?.pubkey),
    validateIntent: (context: BitcoinContext, intent, balances, options?) =>
      validateIntent(context, currencyId, intent, balances, options?.customFees),
    broadcast: (context: BitcoinContext, tx, options?) =>
      broadcast(context, currencyId, tx, options?.broadcastConfig),
    craftTransactionData: (_context: BitcoinContext, intent): BitcoinTxData => ({
      type: "string",
      ...(intent.data?.opReturnData ? { opReturnData: intent.data.opReturnData } : {}),
    }),
  } satisfies CoinModuleImpl<BitcoinCoinConfig, MemoNotSupported, BitcoinTxData>;
}
