import {
  drain,
  fromJsonBalance,
  fromJsonStake,
  readHistory,
  readScope,
  type AccountData,
  type AccountIntent,
  type AccountModuleApi,
  type AccountOperation,
  type AccountRead,
  type CoinIntent,
  type ReadOptions,
} from "@ledgerhq/account-module-framework";
import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { nextSequence } from "./operations";
import { storedState } from "./state";
import { createRefresh } from "./sync";
import type {
  SingleAddressAccountModuleOptions,
  SingleAddressAccountState,
  SingleAddressAccountTypes,
  SingleAddressCoinModule,
  SingleAddressScope,
} from "./types";

type Account = AccountData<SingleAddressAccountState>;

const assetReferenceOf = (asset: AssetInfo): string | undefined =>
  "assetReference" in asset ? asset.assetReference : undefined;

const isBalanceOf =
  (asset: AssetInfo) =>
  (balance: Balance): boolean =>
    balance.asset.type === asset.type &&
    assetReferenceOf(balance.asset) === assetReferenceOf(asset);

const atLeastZero = (value: bigint): bigint => (value > 0n ? value : 0n);

const balancesOf = (state: SingleAddressAccountState): Balance[] =>
  state.balances.map(fromJsonBalance);

/**
 * The account module of the families whose account is one address (`descriptor.key`). Every chain
 * detail is delegated to `coinModule`.
 */
export function createSingleAddressAccountModule(
  coinModule: SingleAddressCoinModule,
  options: SingleAddressAccountModuleOptions = {},
): AccountModuleApi<SingleAddressAccountTypes> {
  const { now = Date.now, addressPath = descriptor => descriptor.derivationPath } = options;
  const { scopes, refresh } = createRefresh(coinModule, options);

  /** A read of one scope: refreshed first when asked, from the stored state and history. */
  const read = <T>(
    context: Context<any>,
    account: Account,
    scope: SingleAddressScope,
    readOptions: ReadOptions | undefined,
    valueOf: (state: SingleAddressAccountState) => T | Promise<T>,
  ): Promise<AccountRead<T>> =>
    readScope(readOptions, {
      refresh: () => drain(refresh(context, account, [scope])),
      read: async () => {
        const state = await storedState(account.state);
        return { value: await valueOf(state), updatedAt: state.refreshedAt[scope] };
      },
    });

  /**
   * The account's intent as the coin module takes it: sent by the account, its `data` crafted by
   * the coin module when the intent carries none (a throw propagates).
   */
  function toCoinIntent(
    context: Context<any>,
    { descriptor }: Account,
    { accountOptions, ...intent }: AccountIntent<never>,
  ): CoinIntent {
    const coinIntent: CoinIntent = { ...intent, sender: descriptor.key };
    return {
      ...coinIntent,
      data: intent.data ?? coinModule.craftTransactionData(context, coinIntent),
    };
  }

  async function sequenceFor(context: Context<any>, account: Account): Promise<bigint | undefined> {
    let networkSequence: bigint;
    try {
      networkSequence = await coinModule.getNextSequence(context, account.descriptor.key);
    } catch {
      return undefined;
    }
    const pending = (await readHistory(account.history)).filter(op => op.optimistic);
    return nextSequence(networkSequence, pending);
  }

  return {
    sync: (context, account, syncOptions) => refresh(context, account, scopes, syncOptions?.signal),

    getBalances: (context, account, readOptions) =>
      read(context, account, "balances", readOptions, balancesOf),
    listOperations: (context, account, listOptions) => {
      const { refresh: _refresh, ...page } = listOptions ?? {};
      return read(context, account, "operations", listOptions, () => account.history.list(page));
    },
    getPendingOperations: (context, account, readOptions) =>
      read(context, account, "operations", readOptions, async () =>
        (await readHistory(account.history)).filter(op => op.block === null || op.optimistic),
      ),
    getStakes: async (context, account, readOptions) =>
      scopes.includes("stakes")
        ? read(context, account, "stakes", readOptions, state => state.stakes.map(fromJsonStake))
        : { value: [] },
    // The address is the account key; whether it is used comes from the operations.
    getAddresses: (context, account, readOptions) =>
      read(context, account, "operations", readOptions, async () => {
        const { items } = await account.history.list({ limit: 1 });
        return [
          {
            address: account.descriptor.key,
            derivationPath: addressPath(account.descriptor),
            used: items.length > 0,
          },
        ];
      }),
    // The address is the account key: no network, always fresh.
    getFreshAddress: async (_context, { descriptor }) => ({
      value: { address: descriptor.key, derivationPath: addressPath(descriptor) },
    }),

    estimateFees: (context, account, intent, feeOptions) =>
      coinModule.estimateFees(context, toCoinIntent(context, account, intent), feeOptions),
    validateIntent: async (context, account, intent, validateOptions) =>
      coinModule.validateIntent(
        context,
        toCoinIntent(context, account, intent),
        balancesOf(await storedState(account.state)),
        validateOptions,
      ),
    estimateMaxSpendable: async (context, account, intent, feeOptions) => {
      const balance = balancesOf(await storedState(account.state)).find(isBalanceOf(intent.asset));
      const available = balance ? atLeastZero(balance.value - (balance.locked ?? 0n)) : 0n;
      if (intent.asset.type !== "native") return available;
      const sendMax = {
        ...toCoinIntent(context, account, intent),
        amount: available,
        useAllAmount: true,
      };
      const { value: fee } = await coinModule.estimateFees(context, sendMax, feeOptions);
      return atLeastZero(available - fee);
    },
    craftTransaction: async (context, account, intent, craftOptions) => {
      const sequence = intent.sequence ?? (await sequenceFor(context, account));
      const coinIntent = {
        ...toCoinIntent(context, account, intent),
        ...(sequence === undefined ? {} : { sequence }),
      };
      const crafted = await coinModule.craftTransaction(context, coinIntent, craftOptions);
      const fee =
        craftOptions?.customFees?.value ??
        (await coinModule.estimateFees(context, coinIntent)).value;
      const operation: AccountOperation = {
        id: "",
        hash: "",
        type: "OUT",
        value: intent.asset.type === "native" ? intent.amount + fee : intent.amount,
        fee,
        asset: intent.asset,
        senders: [account.descriptor.key],
        recipients: [intent.recipient],
        block: null,
        date: new Date(now()),
        failed: false,
        optimistic: true,
        ...(sequence === undefined ? {} : { details: { sequence: sequence.toString() } }),
      };
      return { ...crafted, operation };
    },
    combine: async (context, _account, crafted, signatures, combineOptions) =>
      coinModule.combine(context, crafted.transaction, signatures, combineOptions),
    broadcast: async (context, { history }, signedTransaction, crafted, broadcastOptions) => {
      const hash = await coinModule.broadcast(context, signedTransaction, broadcastOptions);
      const operation = { ...crafted.operation, hash, id: `${hash}-${crafted.operation.type}` };
      await history.upsert([operation]);
      return operation;
    },
  };
}
