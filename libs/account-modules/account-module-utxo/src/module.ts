import {
  drain,
  readHistory,
  readScope,
  type AccountData,
  type AccountDescriptor,
  type AccountIntent,
  type AccountOperation,
  type AccountRead,
  type CraftedAccountTransaction,
  type ReadOptions,
} from "@ledgerhq/account-module-framework";
import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { addressPath, deriverOf, displayOf, nextAddress } from "./addresses";
import { completeIntent, selectableUtxos } from "./intent";
import type { UtxoOperationDetails } from "./interpret";
import { UtxoAccountNotSyncedError, storedState } from "./state";
import { syncAccount, type SyncSettings } from "./sync";
import type {
  Utxo,
  UtxoAccountModuleApi,
  UtxoAccountModuleOptions,
  UtxoAccountOptions,
  UtxoAccountState,
  UtxoCoinModuleApi,
  UtxoCraftedDetails,
} from "./types";

const NATIVE = { type: "native" } as const;

const sumOf = (values: bigint[]): bigint => values.reduce((sum, value) => sum + value, 0n);

const isCraftedDetails = (details: unknown): details is UtxoCraftedDetails =>
  !!details &&
  typeof details === "object" &&
  Array.isArray((details as UtxoCraftedDetails).inputs) &&
  typeof (details as UtxoCraftedDetails).fee === "bigint" &&
  typeof (details as UtxoCraftedDetails).amount === "bigint";

/**
 * The account module of UTXO chains: an account is an extended public key whose funds sit on the
 * addresses of its HD chains. It owns what any such account needs — the gap walk, the history
 * merge across addresses, the UTXO set, the reserved outputs, the change — and delegates what the
 * chain means to its coin module: deriving addresses, reading transactions, selecting and pricing
 * inputs, crafting, signing data and broadcasting.
 */
export function createUtxoAccountModule(
  api: UtxoCoinModuleApi,
  options: UtxoAccountModuleOptions = {},
): UtxoAccountModuleApi {
  const settings: SyncSettings = {
    receiveChain: options.receiveChain ?? 0,
    changeChain: options.changeChain ?? 1,
    gapLimit: options.gapLimit ?? 20,
    rewindBlocks: options.rewindBlocks ?? 6,
    now: options.now ?? Date.now,
    ...(options.replacedOperationExpiryMs
      ? { replacedOperationExpiryMs: options.replacedOperationExpiryMs }
      : {}),
  };
  const display = displayOf(api);

  const utxosOf = (descriptor: AccountDescriptor, state: UtxoAccountState | undefined): Utxo[] => {
    if (!state) return [];
    const byAddress = new Map(state.addresses.map(a => [a.address, a]));
    return state.utxos.flatMap(utxo => {
      const owner = byAddress.get(utxo.address);
      if (!owner) return [];
      return [
        {
          txid: utxo.txid,
          vout: utxo.vout,
          value: BigInt(utxo.value),
          address: display(utxo.address),
          derivationPath: addressPath(descriptor.derivationPath, owner.chain, owner.index),
          height: utxo.height,
          replaceable: utxo.replaceable,
          change: owner.chain === settings.changeChain,
        },
      ];
    });
  };

  const balancesOf = (state: UtxoAccountState | undefined): Balance[] =>
    state ? [{ value: sumOf(state.utxos.map(u => BigInt(u.value))), asset: NATIVE }] : [];

  const addressOnChain = async (
    context: Context<any>,
    descriptor: AccountDescriptor,
    state: UtxoAccountState | undefined,
    chain: number,
  ) => {
    const derive = deriverOf(api, context, descriptor);
    const next = await nextAddress(derive, descriptor, state?.addresses ?? [], chain);
    return { address: display(next.address), derivationPath: next.derivationPath };
  };

  /**
   * A read: every one derives from the walk of the addresses, so a refresh runs the whole sync;
   * `updatedAt` is the time of the last walk.
   */
  const read = <T>(
    context: Context<any>,
    account: AccountData<UtxoAccountState>,
    readOptions: ReadOptions | undefined,
    valueOf: (state: UtxoAccountState | undefined) => T | Promise<T>,
  ): Promise<AccountRead<T>> =>
    readScope(readOptions, {
      refresh: () => drain(syncAccount(api, settings, context, account)),
      read: async () => {
        const state = await storedState(account.state);
        return { value: await valueOf(state), updatedAt: state?.refreshedAt ?? 0 };
      },
    });

  const complete = (
    context: Context<any>,
    account: AccountData<UtxoAccountState>,
    intent: AccountIntent<UtxoAccountOptions>,
    customFeesParameters?: Record<string, unknown>,
  ) => completeIntent(api, settings, context, account, intent, customFeesParameters);

  return {
    sync: (context, account, syncOptions) =>
      syncAccount(api, settings, context, account, syncOptions?.signal),

    getBalances: (context, account, readOptions) => read(context, account, readOptions, balancesOf),
    listOperations: (context, account, listOptions) => {
      const { refresh: _refresh, ...page } = listOptions ?? {};
      return read(context, account, listOptions, () => account.history.list(page));
    },
    getPendingOperations: (context, account, readOptions) =>
      read(context, account, readOptions, async () =>
        (await readHistory(account.history)).filter(op => op.block === null),
      ),
    // No stakes on a UTXO chain: no network, always fresh.
    getStakes: async () => ({ value: [] }),
    getUTXOs: (context, account, { filter = () => true, ...readOptions } = {}) =>
      read(context, account, readOptions, state =>
        utxosOf(account.descriptor, state).filter(filter),
      ),
    getAddresses: (context, account, readOptions) =>
      read(context, account, readOptions, state =>
        (state?.addresses ?? []).map(a => ({
          address: display(a.address),
          derivationPath: addressPath(account.descriptor.derivationPath, a.chain, a.index),
          used: true,
        })),
      ),
    getFreshAddress: (context, account, readOptions) =>
      read(context, account, readOptions, state =>
        addressOnChain(context, account.descriptor, state, settings.receiveChain),
      ),
    getChangeAddress: async (context, account) =>
      addressOnChain(
        context,
        account.descriptor,
        await storedState(account.state),
        settings.changeChain,
      ),

    estimateFees: async (context, account, intent, feeOptions) =>
      api.estimateFees(
        context,
        await complete(context, account, intent, feeOptions?.customFeesParameters),
        feeOptions,
      ),
    validateIntent: async (context, account, intent, validateOptions) =>
      api.validateIntent(
        context,
        await complete(context, account, intent, validateOptions?.customFees?.parameters),
        balancesOf(await storedState(account.state)),
        validateOptions,
      ),
    estimateMaxSpendable: async (context, account, intent, feeOptions) => {
      const state = await storedState(account.state);
      if (!state) throw new UtxoAccountNotSyncedError();
      const sendMax = { ...intent, useAllAmount: true };
      const completed = await complete(context, account, sendMax, feeOptions?.customFeesParameters);
      const estimation = await api.estimateFees(context, completed, feeOptions);
      const amount = estimation.parameters?.amount;
      if (typeof amount === "bigint") return amount;
      const operations = await readHistory(account.history);
      const selectable = selectableUtxos(state, operations, settings.changeChain);
      const spendable = sumOf(selectable.map(u => BigInt(u.value)));
      return spendable > estimation.value ? spendable - estimation.value : 0n;
    },
    craftTransaction: async (context, account, intent, craftOptions) => {
      const completed = await complete(
        context,
        account,
        intent,
        craftOptions?.customFees?.parameters,
      );
      const crafted = await api.craftTransaction(context, completed, craftOptions);
      return {
        ...crafted,
        operation: optimisticOperation(crafted.details, intent, settings.now()),
      };
    },
    combine: async (context, _account, crafted, signatures, combineOptions) =>
      api.combine(context, crafted.transaction, signatures, combineOptions),
    broadcast: async (context, account, signedTransaction, crafted, broadcastOptions) => {
      const hash = await api.broadcast(context, signedTransaction, broadcastOptions);
      const operation: AccountOperation = { ...crafted.operation, hash, id: `${hash}-OUT` };
      await account.history.upsert([operation]);
      return operation;
    },
  };

  function optimisticOperation(
    details: unknown,
    intent: AccountIntent<UtxoAccountOptions>,
    now: number,
  ): CraftedAccountTransaction["operation"] {
    const crafted = isCraftedDetails(details) ? details : undefined;
    const fee = crafted?.fee ?? 0n;
    const operationDetails: UtxoOperationDetails = {
      inputs: crafted?.inputs ?? [],
      replaceable: crafted?.replaceable ?? false,
    };
    return {
      id: "",
      hash: "",
      type: "OUT",
      value: (crafted?.amount ?? intent.amount) + fee,
      fee,
      asset: NATIVE,
      senders: (crafted?.senders ?? []).map(display),
      recipients: crafted?.recipients.length ? crafted.recipients.map(display) : [intent.recipient],
      block: null,
      date: new Date(now),
      failed: false,
      optimistic: true,
      details: operationDetails,
    };
  }
}
