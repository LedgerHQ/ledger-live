import {
  fromJsonBalance,
  fromJsonStake,
  readHistory,
  type AccountData,
  type AccountIntent,
  type AccountModuleApi,
  type AccountOperation,
  type CoinIntent,
} from "@ledgerhq/account-module-framework";
import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { nextSequence } from "./operations";
import { readState } from "./state";
import { createSync } from "./sync";
import type {
  SingleAddressAccountModuleOptions,
  SingleAddressAccountState,
  SingleAddressAccountTypes,
  SingleAddressCoinModule,
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

const balancesOf = ({ state }: Account): Balance[] =>
  readState(state)?.balances.map(fromJsonBalance) ?? [];

const toCoinIntent = (
  { descriptor }: Account,
  { accountOptions, ...intent }: AccountIntent<never>,
): CoinIntent => ({ ...intent, sender: descriptor.key });

/**
 * The account module of the families whose account is one address (`descriptor.key`). Every chain
 * detail is delegated to `coinModule`.
 */
export function createSingleAddressAccountModule(
  coinModule: SingleAddressCoinModule,
  options: SingleAddressAccountModuleOptions = {},
): AccountModuleApi<SingleAddressAccountTypes> {
  const { now = Date.now, addressPath = descriptor => descriptor.derivationPath } = options;

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
    sync: createSync(coinModule, options),

    getBalances: async (_context, account) => balancesOf(account),
    listOperations: (_context, { history }, listOptions) => history.list(listOptions),
    getPendingOperations: async (_context, { history }) =>
      (await readHistory(history)).filter(op => op.block === null || op.optimistic),
    getStakes: async (_context, { state }) => readState(state)?.stakes.map(fromJsonStake) ?? [],
    getAddresses: async (_context, { descriptor, history }) => {
      const { items } = await history.list({ limit: 1 });
      return [
        {
          address: descriptor.key,
          derivationPath: addressPath(descriptor),
          used: items.length > 0,
        },
      ];
    },
    getFreshAddress: async (_context, { descriptor }) => ({
      address: descriptor.key,
      derivationPath: addressPath(descriptor),
    }),

    estimateFees: (context, account, intent, feeOptions) =>
      coinModule.estimateFees(context, toCoinIntent(account, intent), feeOptions),
    validateIntent: (context, account, intent, validateOptions) =>
      coinModule.validateIntent(
        context,
        toCoinIntent(account, intent),
        balancesOf(account),
        validateOptions,
      ),
    estimateMaxSpendable: async (context, account, intent, feeOptions) => {
      const balance = balancesOf(account).find(isBalanceOf(intent.asset));
      const available = balance ? atLeastZero(balance.value - (balance.locked ?? 0n)) : 0n;
      if (intent.asset.type !== "native") return available;
      const sendMax = { ...toCoinIntent(account, intent), amount: available, useAllAmount: true };
      const { value: fee } = await coinModule.estimateFees(context, sendMax, feeOptions);
      return atLeastZero(available - fee);
    },
    craftTransaction: async (context, account, intent, craftOptions) => {
      const sequence = intent.sequence ?? (await sequenceFor(context, account));
      const coinIntent = {
        ...toCoinIntent(account, intent),
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
