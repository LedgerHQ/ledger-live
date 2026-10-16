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
} from "@ledgerhq/coin-module-framework/api/index";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  broadcast,
  combine,
  craftTransaction,
  deriveAddress,
  displayAddress,
  estimateFees,
  explorerFor,
  getBalance,
  getBlockInfo,
  getTransaction,
  isValidAddress,
  lastBlock,
  listAddressTransactions,
  listOperations,
  selectInputs,
  validateIntent,
  type BitcoinCoinConfig,
  type BitcoinContext,
  type BitcoinTxData,
  type BitcoinUtxoTransaction,
  type DeriveAddressRequest,
  type SelectInputsRequest,
  withNormalizedRecipient,
} from "../logic/index";

export type * from "../logic/types";
export { getNetworkParameters, type BitcoinLikeNetworkParameters } from "../logic/networks";
export type { CraftedDetails } from "../logic/craftTransaction";
export { getBitcoinEstimationRecipient } from "../constants";
export {
  buildKnownAddressDerivations,
  feeFromPsbt,
  parsePsbt,
  type KnownAddressDerivations,
} from "../logic/psbt";
export {
  REPLACE_CANCEL,
  REPLACE_SPEEDUP,
  BITCOIN_OPERATION_DETAILS_VERSION,
  BITCOIN_PICKING_STRATEGY,
  BITCOIN_SIGNING_ENVELOPE_VERSION,
} from "../logic/types";
export { toBitcoinDerivationMode, type DeriveAddressRequest } from "../logic/derivation";
export { displayAddress as bitcoinDisplayAddress } from "../logic/currency";
export type { SelectInputsRequest } from "../logic/selectInputs";

type Intent = TransactionIntent<MemoNotSupported, BitcoinTxData>;

/**
 * Coin-module factory for the bitcoin family (every transparent bitcoin-like the Ledger explorer
 * serves). Bitcoin is a UTXO chain and this API is per address, like the contract: it answers for
 * the address it is given, and its transaction methods spend the inputs the caller selected
 * (`BitcoinTxData.inputs`). The account — the addresses of an xpub, its UTXO set, the coin
 * selection and the change — is the caller's (ADR-065).
 *
 * On top of the contract, the stateless primitives a UTXO account module builds the account with
 * (ADR-064): `deriveAddress`, `listAddressTransactions`, `getTransaction`, `selectInputs` — the
 * bitcoin rules applied to the candidates the account hands in — and `displayAddress`.
 *
 * Omitted, with the reason each one does not apply:
 *  - `getNextSequence` — no account nonce; replay protection comes from spending one-time UTXOs.
 *  - `getBlock` — the explorer serves block headers only.
 *  - `craftRawTransaction` — raw (PSBT) signing goes through the family's own signing flow.
 *  - `getStakes`, `getRewards`, `getValidators`, `call`, `register` — not applicable.
 */
export function createApi(currencyId: string) {
  // the coin config is read at each call (ADR-019): a remote change of the explorer applies at once
  const explorerOf = (context: BitcoinContext) => explorerFor(context, currencyId);

  const coinModuleApi = {
    lastBlock: async (context: BitcoinContext): Promise<BlockInfo> =>
      lastBlock(await explorerOf(context)),
    getBlockInfo: async (context: BitcoinContext, height: number): Promise<BlockInfo> =>
      getBlockInfo(await explorerOf(context), height),

    getBalance: async (
      context: BitcoinContext,
      address: string,
      balanceOptions?: BalanceOptions,
    ): Promise<Balance[]> => {
      const explorer = await explorerOf(context);
      return rejectBalanceOptions(() => getBalance(explorer, address), balanceOptions);
    },
    listOperations: async (
      context: BitcoinContext,
      address: string,
      listOptions: ListOperationsOptions,
    ): Promise<Page<Operation>> => listOperations(await explorerOf(context), address, listOptions),

    estimateFees: async (
      context: BitcoinContext,
      intent: Intent,
      feeOptions?: { customFeesParameters?: FeeEstimation["parameters"] },
    ): Promise<FeeEstimation> =>
      estimateFees(
        await explorerOf(context),
        currencyId,
        withNormalizedRecipient(intent),
        feeOptions?.customFeesParameters,
      ),
    validateIntent: async (
      context: BitcoinContext,
      intent: Intent,
      _balances: Balance[],
      validateOptions?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> =>
      validateIntent(
        await explorerOf(context),
        currencyId,
        withNormalizedRecipient(intent),
        validateOptions?.customFees,
      ),
    craftTransaction: async (
      context: BitcoinContext,
      intent: Intent,
      craftOptions?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> =>
      craftTransaction(
        await explorerOf(context),
        currencyId,
        withNormalizedRecipient(intent),
        craftOptions?.customFees,
      ),
    combine: (_context: BitcoinContext, tx: string, signature: string[]): string =>
      combine(tx, signature),
    broadcast: async (
      context: BitcoinContext,
      tx: string,
      broadcastOptions?: { broadcastConfig?: BroadcastConfig },
    ): Promise<string> =>
      broadcast(await explorerOf(context), tx, broadcastOptions?.broadcastConfig),

    validateAddress: async (_context: BitcoinContext, address: string): Promise<boolean> =>
      isValidAddress(address, currencyId),
    craftTransactionData: (_context: BitcoinContext, _intent: Intent): BitcoinTxData => ({
      type: "bitcoin",
    }),
  } satisfies CoinModuleImpl<BitcoinCoinConfig, MemoNotSupported, BitcoinTxData>;

  return {
    ...coinModuleApi,

    deriveAddress: (_context: BitcoinContext, request: DeriveAddressRequest): Promise<string> =>
      deriveAddress(currencyId, request),
    listAddressTransactions: async (
      context: BitcoinContext,
      address: string,
      listOptions: ListOperationsOptions,
    ): Promise<Page<BitcoinUtxoTransaction>> =>
      listAddressTransactions(await explorerOf(context), address, listOptions),
    getTransaction: async (
      context: BitcoinContext,
      txid: string,
    ): Promise<Pick<BitcoinUtxoTransaction, "id" | "fees" | "inputs" | "outputs">> =>
      getTransaction(await explorerOf(context), currencyId, txid),
    selectInputs: async (
      context: BitcoinContext,
      request: SelectInputsRequest,
    ): Promise<Array<{ txid: string; vout: number }>> =>
      selectInputs(
        await explorerOf(context),
        currencyId,
        { ...request, intent: withNormalizedRecipient(request.intent) },
        context.logger,
      ),
    displayAddress: (address: string): string => displayAddress(currencyId, address),
  };
}
