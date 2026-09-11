import type {
  Balance,
  BalanceOptions,
  BlockInfo,
  BroadcastConfig,
  CoinModuleImpl,
  CraftedTransaction,
  FeeEstimation,
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
  TransactionIntent,
  TransactionValidation,
  TxDataNotSupported,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import type { BitcoinCoinConfig, BitcoinContext } from "./config";
import { broadcast } from "../logic/broadcast";
import { getBalance } from "../logic/getBalance";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { craftTransaction } from "../logic/craftTransaction";
import { combine } from "../logic/combine";
import { estimateFees } from "../logic/estimateFees";
import { validateAddress } from "../logic/validateAddress";
import { validateIntent } from "../logic/validateIntent";

/**
 * coin-bitcoin Alpaca (CoinModuleApi) factory — Scope A (native), **work in progress**.
 *
 * Multi-currency: instantiated per `currencyId` (bitcoin, litecoin, dogecoin, …), following the
 * coin-evm pattern. Each method resolves its config via `context.config(currencyId)` (ADR-019).
 *
 * PURELY ADDITIVE: the legacy `createBridges` surface (../bridge) is untouched and remains the
 * shipping path. Zcash is out of scope. `getNextSequence`, staking, `getBlock`/`getBlockInfo`,
 * `craftRawTransaction`, `register`, `call` are omitted — `withDefaults` answers "not supported"
 * for each (Bitcoin has no account nonce, no staking, etc.).
 *
 * The account-scoped read methods (`getBalance`, `listOperations`) walk the WHOLE account (the xpub
 * passed as `address`) via the stateless gap-limit sync (`../logic/buildAccount`), never a single
 * address. Transaction building (`craftTransaction`, `estimateFees`, `combine`) coin-selects and
 * serializes a PSBT; `validateIntent` checks the send intent against the account balance. Device
 * signing itself stays outside this stateless surface.
 */
// oxlint-disable-next-line explicit-function-return-type
export function createApi(currencyId: string) {
  return {
    broadcast: (
      context: BitcoinContext,
      tx: string,
      options?: { broadcastConfig?: BroadcastConfig },
    ): Promise<string> => broadcast(context, currencyId, tx, options?.broadcastConfig),

    lastBlock: (context: BitcoinContext): Promise<BlockInfo> => lastBlock(context, currencyId),

    validateAddress: (_context: BitcoinContext, address, parameters): Promise<boolean> =>
      validateAddress(address, parameters),

    validateIntent: (
      context: BitcoinContext,
      intent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> =>
      validateIntent(context, currencyId, intent, balances, options?.customFees),

    craftTransactionData: (
      _context: BitcoinContext,
      intent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
    ) => craftTransactionData(intent),

    // Native balance over the whole account (xpub). NOTE: not wrapped in `rejectBalanceOptions` —
    // Bitcoin consumes `options.derivationPath`.
    getBalance: (
      context: BitcoinContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> => getBalance(context, currencyId, address, options?.derivationPath),

    // Account-wide native history over the xpub (all gap-limit-discovered addresses).
    listOperations: (
      context: BitcoinContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation<MemoNotSupported>>> =>
      listOperations(context, currencyId, address, options),

    estimateFees: (
      context: BitcoinContext,
      intent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
      options?: { customFeesParameters?: FeeEstimation["parameters"] },
    ): Promise<FeeEstimation> =>
      estimateFees(context, currencyId, intent, options?.customFeesParameters),

    // Craft an unsigned PSBT via coin selection. A user fee rate (options.customFees.parameters.
    // feePerByte, sat/vB) overrides the network estimate. Device-signability (BIP32 derivations /
    // wallet policy) is the remaining ADR-032 piece — see craftTransaction/combine.
    craftTransaction: (
      context: BitcoinContext,
      intent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
      options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> =>
      craftTransaction(context, currencyId, intent, options?.customFees),

    combine: (
      _context: BitcoinContext,
      tx: string,
      signature: string[],
      _options?: { pubkey?: string },
    ): string => combine(tx, signature),
  } satisfies CoinModuleImpl<BitcoinCoinConfig, MemoNotSupported, TxDataNotSupported>;
}
