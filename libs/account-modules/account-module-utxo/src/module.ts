import {
  readHistory,
  type AccountData,
  type AccountIntent,
  type AccountOperation,
  type CraftedAccountTransaction,
} from "@ledgerhq/account-module-framework";
import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { addressPath, deriverOf, displayOf, nextAddress } from "./addresses";
import { completeIntent, selectableUtxos } from "./intent";
import type { UtxoOperationDetails } from "./interpret";
import { UtxoAccountNotSyncedError, readState } from "./state";
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

  const utxosOf = (account: AccountData<UtxoAccountState>): Utxo[] => {
    const state = readState(account.state);
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
          derivationPath: addressPath(account.descriptor.derivationPath, owner.chain, owner.index),
          height: utxo.height,
          replaceable: utxo.replaceable,
          change: owner.chain === settings.changeChain,
        },
      ];
    });
  };

  const balancesOf = (account: AccountData<UtxoAccountState>): Balance[] => {
    const state = readState(account.state);
    return state ? [{ value: sumOf(state.utxos.map(u => BigInt(u.value))), asset: NATIVE }] : [];
  };

  const addressOnChain = async (
    context: Context<any>,
    account: AccountData<UtxoAccountState>,
    chain: number,
  ) => {
    const derive = deriverOf(api, context, account.descriptor);
    const addresses = readState(account.state)?.addresses ?? [];
    const next = await nextAddress(derive, account.descriptor, addresses, chain);
    return { address: display(next.address), derivationPath: next.derivationPath };
  };

  const complete = (
    context: Context<any>,
    account: AccountData<UtxoAccountState>,
    intent: AccountIntent<UtxoAccountOptions>,
    customFeesParameters?: Record<string, unknown>,
  ) => completeIntent(api, settings, context, account, intent, customFeesParameters);

  return {
    sync: (context, account, syncOptions) =>
      syncAccount(api, settings, context, account, syncOptions?.signal),

    getBalances: async (_context, account) => balancesOf(account),
    listOperations: (_context, account, listOptions) => account.history.list(listOptions),
    getPendingOperations: async (_context, account) =>
      (await readHistory(account.history)).filter(op => op.block === null),
    getStakes: async () => [],
    getUTXOs: async (_context, account, filter) => utxosOf(account).filter(filter ?? (() => true)),
    getAddresses: async (_context, account) => {
      const state = readState(account.state);
      return (state?.addresses ?? []).map(a => ({
        address: display(a.address),
        derivationPath: addressPath(account.descriptor.derivationPath, a.chain, a.index),
        used: true,
      }));
    },
    getFreshAddress: (context, account) => addressOnChain(context, account, settings.receiveChain),
    getChangeAddress: (context, account) => addressOnChain(context, account, settings.changeChain),

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
        balancesOf(account),
        validateOptions,
      ),
    estimateMaxSpendable: async (context, account, intent, feeOptions) => {
      const state = readState(account.state);
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
