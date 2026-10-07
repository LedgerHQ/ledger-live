import type {
  CoinModuleImpl,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { coinTraits } from "../logic/coinTraits";
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
import {
  normalizeBalances,
  normalizeFeeParameters,
  normalizeFees,
  normalizeIntent,
} from "../logic/normalize";

export type { BitcoinTxData } from "../logic/intent";
export {
  type DeviceSigningParameters,
  type SigningRequest,
  deviceSigningParameters,
} from "../logic/signingRequest";

/**
 * Stateless, single-address Coin Module API for one currency served by coin-bitcoin.
 *
 * The configuration is read on every call through `context.config(currencyId)`. Capabilities the
 * module does not have (staking, validators, raw crafting, …) are omitted: the consumer's
 * `withDefaults` answers them as not supported. Amounts a JSON consumer passes as strings are
 * normalized to bigints here, before the logic. Bitcoin-specific fields (OP_RETURN data) travel in
 * the intent's `data` ({@link BitcoinTxData}).
 *
 * zcash (served by coin-zcash) and zencash (left on the legacy bridge) are refused.
 */
export function createApi(currencyId: string) {
  const notServed = coinTraits[currencyId]?.notServedByCoinModuleApi;
  if (notServed) {
    throw new Error(`unsupported currency ${currencyId}: ${notServed}`);
  }
  const explorerAddress = coinTraits[currencyId]?.explorerAddress ?? ((address: string) => address);
  // Amounts as bigints, and the sender in the form the explorer answers for.
  const toIntent = <I extends TransactionIntent>(intent: I): I => {
    const normalized = normalizeIntent(intent);
    return { ...normalized, sender: explorerAddress(normalized.sender) };
  };
  return {
    getBalance: (context: BitcoinContext, address, options?) =>
      rejectBalanceOptions(
        () => getBalance(context, currencyId, explorerAddress(address)),
        options,
      ),
    lastBlock: (context: BitcoinContext) => lastBlock(context, currencyId),
    getBlockInfo: (context: BitcoinContext, height) => getBlockInfo(context, currencyId, height),
    getBlock: (context: BitcoinContext, height) => getBlock(context, currencyId, height),
    listOperations: (context: BitcoinContext, address, options) =>
      listOperations(context, currencyId, explorerAddress(address), options),
    estimateFees: (context: BitcoinContext, intent, options?) =>
      estimateFees(
        context,
        currencyId,
        toIntent(intent),
        normalizeFeeParameters(options?.customFeesParameters),
      ),
    craftTransaction: (context: BitcoinContext, intent, options?) =>
      craftTransaction(context, currencyId, toIntent(intent), normalizeFees(options?.customFees)),
    combine: (_context: BitcoinContext, tx, signature, options?) =>
      combine(currencyId, tx, signature, options?.pubkey),
    validateIntent: (_context: BitcoinContext, intent, balances, options?) =>
      validateIntent(
        currencyId,
        toIntent(intent),
        normalizeBalances(balances),
        normalizeFees(options?.customFees),
      ),
    broadcast: (context: BitcoinContext, tx, options?) =>
      broadcast(context, currencyId, tx, options?.broadcastConfig),
    craftTransactionData: (_context: BitcoinContext, intent): BitcoinTxData => ({
      type: "bitcoin",
      ...(intent.data?.opReturnData ? { opReturnData: intent.data.opReturnData } : {}),
    }),
  } satisfies CoinModuleImpl<BitcoinCoinConfig, MemoNotSupported, BitcoinTxData>;
}
