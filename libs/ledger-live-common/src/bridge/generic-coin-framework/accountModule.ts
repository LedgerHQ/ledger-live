import BigNumber from "bignumber.js";
import {
  createMemoryHistoryStore,
  type AccountData,
  type AccountIntent,
  type AccountOperation,
  type CraftedAccountTransaction,
} from "@ledgerhq/account-module-framework";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountModuleBinding, BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account, Operation, OperationType } from "@ledgerhq/types-live";

/** "84'/0'" (or a full path, the CLI passes one) and an account index → "84'/0'/3'". */
export function accountPathFrom(derivationPath: string, index: number): string {
  const rootPath = derivationPath.split("/", 2).join("/");
  return `${rootPath}/${index}'`;
}

/** The account path of an account, from its fresh address path "84'/0'/3'/0/12". */
export const accountPathOf = (freshAddressPath: string): string =>
  freshAddressPath.split("/").slice(0, 3).join("/");

const toBigInt = (value: BigNumber): bigint => BigInt(value.integerValue().toFixed());

/** The account operation a Ledger Wallet operation stands for. */
export function toAccountOperation(op: Operation, optimistic: boolean): AccountOperation {
  const extra = (op.extra ?? {}) as Record<string, unknown>;
  return {
    id: `${op.hash}-${op.type}`,
    hash: op.hash,
    type: op.type,
    value: toBigInt(op.value),
    fee: toBigInt(op.fee),
    asset: { type: "native" },
    senders: op.senders,
    recipients: op.recipients,
    block:
      op.blockHeight === null || op.blockHeight === undefined
        ? null
        : { height: op.blockHeight, hash: op.blockHash ?? "", time: op.date },
    date: op.date,
    failed: op.hasFailed ?? false,
    ...(optimistic ? { optimistic: true } : {}),
    details: {
      ...extra,
      ...(op.transactionSequenceNumber === undefined
        ? {}
        : { sequence: op.transactionSequenceNumber.toNumber() }),
    },
  };
}

/** The Ledger Wallet operation of an account operation. */
export function toLiveOperation(
  binding: Pick<AccountModuleBinding, "toLiveOperation">,
  accountId: string,
  op: AccountOperation,
): Operation {
  const { sequence, ...extra } = (op.details ?? {}) as { sequence?: unknown };
  const type = op.type as OperationType;
  const live: Operation = {
    id: encodeOperationId(accountId, op.hash, type),
    hash: op.hash,
    type,
    value: new BigNumber(op.value.toString()),
    fee: new BigNumber(op.fee.toString()),
    senders: op.senders,
    recipients: op.recipients,
    blockHeight: op.block?.height,
    blockHash: op.block?.hash,
    accountId,
    date: op.date,
    hasFailed: op.failed,
    extra,
    ...(typeof sequence === "number" || typeof sequence === "string"
      ? { transactionSequenceNumber: new BigNumber(sequence) }
      : {}),
  };
  return binding.toLiveOperation?.(op, live) ?? live;
}

/** What the account module knows of a Ledger Wallet account; its pending operations are optimistic. */
export function accountDataOf(binding: AccountModuleBinding, account: Account): AccountData {
  return {
    descriptor: {
      currencyId: account.currency.id,
      derivationMode: account.derivationMode,
      index: account.index,
      key: decodeAccountId(account.id).xpubOrAddress,
      derivationPath: accountPathOf(account.freshAddressPath),
    },
    state: binding.readState(account),
    history: createMemoryHistoryStore([
      ...account.operations.map(op => toAccountOperation(op, false)),
      ...account.pendingOperations.map(op => toAccountOperation(op, true)),
    ]),
  };
}

/**
 * The shape of an account served by an account module: the module syncs it from the state and the
 * operations the account holds, and the account is rebuilt from what the module reads.
 */
export async function getAccountModuleShape(
  binding: AccountModuleBinding,
  info: AccountShapeInfo,
  {
    api,
    context,
    signerContext,
  }: { api: CoinModuleApi<any, any, any>; context: Context<any>; signerContext: SignerContext<any> },
): Promise<Partial<Account>> {
  const { currency, index, derivationPath, derivationMode, deviceId, initialAccount } = info;
  const accountPath = accountPathFrom(derivationPath, index);
  const key = initialAccount
    ? decodeAccountId(initialAccount.id).xpubOrAddress
    : await binding.getAccountKey(
        { currencyId: currency.id, derivationPath: accountPath, derivationMode, deviceId },
        signerContext,
      );
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: key,
    derivationMode,
  });
  const module = binding.create(api, currency.id);
  const history = createMemoryHistoryStore(
    (initialAccount?.operations ?? []).map(op => toAccountOperation(op, false)),
  );
  const account: AccountData = {
    descriptor: { currencyId: currency.id, derivationMode, index, key, derivationPath: accountPath },
    state: binding.readState(initialAccount),
    history,
  };

  let blockHeight: number | undefined;
  for await (const event of module.sync(context, account)) {
    account.state = event.state;
    blockHeight = event.progress.blockHeight ?? blockHeight;
  }

  const [balances, fresh, fields] = await Promise.all([
    module.getBalances(context, account),
    module.getFreshAddress(context, account),
    binding.accountFields({ module, context, account }),
  ]);
  const native = balances.find(balance => balance.asset.type === "native");
  const balance = new BigNumber((native?.value ?? 0n).toString());
  const operations = history
    .snapshot()
    .filter(op => !op.optimistic)
    .map(op => toLiveOperation(binding, accountId, op));

  return {
    id: accountId,
    balance,
    spendableBalance: balance.minus((native?.locked ?? 0n).toString()),
    operations,
    operationsCount: operations.length,
    freshAddress: fresh.address,
    freshAddressPath: fresh.derivationPath,
    ...(blockHeight === undefined ? {} : { blockHeight }),
    ...fields,
  };
}

/**
 * Pending operations of an account-module account: one is settled when its own transaction is
 * synced, or when the family says it is otherwise (replaced, double spent).
 */
export function accountModulePostSync(binding: AccountModuleBinding, synced: Account): Account {
  if (synced.pendingOperations.length === 0) return synced;

  const syncedHashes = new Set(synced.operations.map(op => op.hash));
  const pendingByHash = new Map(synced.pendingOperations.map(op => [op.hash, op]));
  const { mergeSentOperation } = binding;
  const operations = mergeSentOperation
    ? synced.operations.map(op => {
        const optimistic = pendingByHash.get(op.hash);
        return optimistic ? mergeSentOperation(op, optimistic) : op;
      })
    : synced.operations;
  const pendingOperations = synced.pendingOperations.filter(
    op => !syncedHashes.has(op.hash) && !binding.isPendingSettled?.(op, synced),
  );
  return { ...synced, operations, pendingOperations };
}

/** The write methods of a coin module, as the generic bridge calls them. */
export type IntentApi = Pick<
  CoinModuleApi<any, any, any>,
  "estimateFees" | "validateIntent" | "craftTransaction" | "combine"
>;

/**
 * The write path of an account: the coin module itself for an address-based family; for a family
 * served by an account module, the module, which completes each intent from the whole account
 * (inputs, change, signing paths) before handing it to the coin module.
 */
export function intentApiFor(
  bridgeApi: Pick<BridgeApi, "accountModule">,
  coinModuleApi: CoinModuleApi<any, any, any>,
  account: Account,
  transaction: Record<string, unknown>,
): IntentApi {
  const binding = bridgeApi.accountModule;
  if (!binding) return coinModuleApi;

  const module = binding.create(coinModuleApi, account.currency.id);
  const data = accountDataOf(binding, account);
  const accountOptions = binding.accountOptions?.(transaction);
  const toAccountIntent = (intent: object) =>
    ({
      ...intent,
      ...(accountOptions === undefined ? {} : { accountOptions }),
    }) as AccountIntent;
  const crafted = new Map<string, CraftedAccountTransaction>();

  return {
    estimateFees: (context, intent, options) =>
      module.estimateFees(context, data, toAccountIntent(intent), options),
    validateIntent: (context, intent, _balances, options) =>
      module.validateIntent(context, data, toAccountIntent(intent), options),
    craftTransaction: async (context, intent, options) => {
      const result = await module.craftTransaction(context, data, toAccountIntent(intent), options);
      crafted.set(result.transaction, result);
      return result;
    },
    combine: (context, transaction, signatures, options) => {
      const craftedTransaction = crafted.get(transaction);
      if (!craftedTransaction) throw new Error("Combining a transaction this account did not craft");
      return module.combine(context, data, craftedTransaction, signatures, options);
    },
  };
}

/** The optimistic operation of a send, completed from what the account module crafted. */
export function decorateWithAccountModule(
  binding: AccountModuleBinding,
  optimistic: Operation,
  crafted: CraftedAccountTransaction,
  account: Account,
  transaction: Record<string, unknown>,
): Operation {
  const { operation } = crafted;
  const { sequence: _sequence, ...details } = (operation.details ?? {}) as { sequence?: unknown };
  const decorated: Operation = {
    ...optimistic,
    fee: new BigNumber(operation.fee.toString()),
    value: new BigNumber(operation.value.toString()),
    senders: operation.senders.length ? operation.senders : optimistic.senders,
    recipients: operation.recipients.length ? operation.recipients : optimistic.recipients,
    extra: { ...(optimistic.extra as Record<string, unknown>), ...details },
  };
  return binding.decorateOptimisticOperation?.(decorated, crafted, account, transaction) ?? decorated;
}
