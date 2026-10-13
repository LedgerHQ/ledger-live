import { log } from "@ledgerhq/logs";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  mergeOps,
  type AccountShapeInfo,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type {
  AccountAddress,
  AccountAddressBook,
  AccountLayer,
  AccountLayerDependencies,
  AccountTransaction,
  MultiAddressAccountFamily,
  MultiAddressAccountState,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account } from "@ledgerhq/types-live";

/** "84'/0'" (or a full path, the CLI passes one) and an account index → "84'/0'/3'". */
export function accountPathFrom(derivationPath: string, index: number): string {
  const rootPath = derivationPath.split("/", 2).join("/");
  return `${rootPath}/${index}'`;
}

/** The account path of an account, from its fresh address path "84'/0'/3'/0/12". */
export const accountPathOf = (freshAddressPath: string): string =>
  freshAddressPath.split("/").slice(0, 3).join("/");

export const addressPath = (accountPath: string, chain: number, index: number): string =>
  `${accountPath}/${chain}/${index}`;

const nextIndex = (addresses: AccountAddress[], chain: number): number =>
  addresses.filter(a => a.chain === chain).reduce((next, a) => Math.max(next, a.index + 1), 0);

/** The addresses of an account, from its persisted state; an account without state must resync. */
export function addressBookOf(
  family: Pick<MultiAddressAccountFamily<any, any>, "readState" | "resyncError" | "addressDeriver">,
  account: Account,
): AccountAddressBook {
  const state = family.readState(account);
  if (!state) throw family.resyncError();
  const accountPath = accountPathOf(account.freshAddressPath);
  const derive = family.addressDeriver(
    account.currency.id,
    account.derivationMode,
    decodeAccountId(account.id).xpubOrAddress,
  );
  return {
    accountPath,
    addresses: state.addresses,
    pathOf: ({ chain, index }) => addressPath(accountPath, chain, index),
    next: async chain => {
      const index = nextIndex(state.addresses, chain);
      return { address: await derive(chain, index), path: addressPath(accountPath, chain, index) };
    },
  };
}

/** Every transaction of an address from `minHeight`, mempool included, confirmed preferred. */
async function fetchTransactions<Tx extends AccountTransaction>(
  family: MultiAddressAccountFamily<Tx, any>,
  { api, context }: AccountLayerDependencies,
  address: string,
  minHeight: number,
): Promise<Tx[]> {
  const byId = new Map<string, Tx>();
  let cursor: string | undefined;
  do {
    const page = await api.listOperations(context, address, {
      minHeight,
      order: "asc",
      ...(cursor ? { cursor } : {}),
    });
    for (const operation of page.items) {
      const tx = family.transactionOf(operation);
      const known = byId.get(tx.id);
      if (!known || (!known.block && tx.block)) byId.set(tx.id, tx);
    }
    const next = page.next || undefined;
    cursor = next && next !== cursor ? next : undefined;
  } while (cursor);
  return [...byId.values()];
}

async function isReorged(
  { api, context }: AccountLayerDependencies,
  anchor: NonNullable<MultiAddressAccountState["anchor"]>,
): Promise<boolean> {
  try {
    const block = await api.getBlockInfo(context, anchor.height);
    return block.hash !== anchor.hash;
  } catch (error) {
    // Unknown is not a reorg: a failing lookup must not wipe the account.
    log("multiAddressAccountLayer", "reorg check skipped", { error });
    return false;
  }
}

const highestBlock = (
  anchor: MultiAddressAccountState["anchor"],
  transactions: AccountTransaction[],
): MultiAddressAccountState["anchor"] =>
  transactions.reduce<MultiAddressAccountState["anchor"]>(
    (best, tx) =>
      tx.block && (!best || tx.block.height > best.height)
        ? { height: tx.block.height, hash: tx.block.hash }
        : best,
    anchor,
  );

/**
 * The shape of an account keyed on an extended public key, whose history is spread on the
 * addresses of its chains, discovered by walking a gap limit. The coin module is asked address by
 * address; the family interprets the transactions against the whole address set.
 */
async function getAccountShape<
  Tx extends AccountTransaction,
  State extends MultiAddressAccountState,
>(
  family: MultiAddressAccountFamily<Tx, State>,
  info: AccountShapeInfo,
  { api, context, signerContext }: AccountLayerDependencies & { signerContext: SignerContext<any> },
): Promise<Partial<Account>> {
  const { currency, index, derivationPath, derivationMode, deviceId, initialAccount } = info;
  const accountPath = accountPathFrom(derivationPath, index);

  // The account is keyed on its extended public key (ADR-054 §1), never on its fresh address.
  const key = initialAccount
    ? decodeAccountId(initialAccount.id).xpubOrAddress
    : await family.getAccountKey({ currencyId: currency.id, accountPath, deviceId }, signerContext);
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: key,
    derivationMode,
  });
  const derive = family.addressDeriver(currency.id, derivationMode, key);
  const dependencies = { api, context };

  let state = family.readState(initialAccount) ?? family.emptyState();
  let previousOperations = initialAccount?.operations ?? [];

  const tip = await api.lastBlock(context);
  if (state.anchor && (await isReorged(dependencies, state.anchor))) {
    log(
      "multiAddressAccountLayer",
      `reorg below ${state.anchor.height}, syncing ${accountId} again`,
    );
    state = family.emptyState();
    previousOperations = [];
  }
  const fromHeight =
    state.syncedHeight > 0 ? Math.max(0, state.syncedHeight - family.rewindBlocks) : 0;

  const known = new Set(state.addresses.map(a => a.address));
  const discovered: AccountAddress[] = [];
  const fetched = new Map<string, Tx>();

  const walkChain = async (chain: number): Promise<void> => {
    for (let start = 0; ; start += family.gapLimit) {
      const used = await Promise.all(
        Array.from({ length: family.gapLimit }, async (_, offset) => {
          const addressIndex = start + offset;
          const address = await derive(chain, addressIndex);
          const isKnown = known.has(address);
          const txs = await fetchTransactions(
            family,
            dependencies,
            address,
            isKnown ? fromHeight : 0,
          );
          if (!isKnown && txs.length > 0) discovered.push({ address, chain, index: addressIndex });
          for (const tx of txs) {
            const previous = fetched.get(tx.id);
            if (!previous || (!previous.block && tx.block)) fetched.set(tx.id, tx);
          }
          return isKnown || txs.length > 0;
        }),
      );
      if (!used.some(Boolean)) return;
    }
  };
  await Promise.all(family.chains.map(walkChain));

  const addresses = [...state.addresses, ...discovered];
  const transactions = [...fetched.values()];
  const confirmed = transactions.filter(tx => tx.block);
  const pending = transactions.filter(tx => !tx.block);

  const operations = mergeOps(
    previousOperations,
    family.interpret(transactions, { currencyId: currency.id, accountId, addresses }),
  );
  const settled = family.settle({
    currencyId: currency.id,
    state: {
      ...state,
      syncedHeight: tip.height,
      anchor: highestBlock(state.anchor, confirmed),
      addresses,
    },
    confirmed,
    pending,
    operations,
  });

  const freshAddressIndex = nextIndex(addresses, family.receiveChain);
  const freshAddress = await derive(family.receiveChain, freshAddressIndex);

  return {
    id: accountId,
    xpub: key,
    balance: settled.balance,
    spendableBalance: settled.spendableBalance,
    operations: settled.operations,
    operationsCount: settled.operations.length,
    freshAddress: family.displayAddress?.(currency.id, freshAddress) ?? freshAddress,
    freshAddressPath: addressPath(accountPath, family.receiveChain, freshAddressIndex),
    blockHeight: tip.height,
    ...settled.accountFields,
  };
}

/**
 * Pending operations of a multi-address account have no nonce: one is settled when its own
 * transaction is synced, or when the family says it is otherwise (replaced, double spent).
 */
function postSync(family: MultiAddressAccountFamily<any, any>, synced: Account): Account {
  if (synced.pendingOperations.length === 0) return synced;

  const syncedHashes = new Set(synced.operations.map(op => op.hash));
  const pendingByHash = new Map(synced.pendingOperations.map(op => [op.hash, op]));
  const { mergeSentOperation } = family;
  const operations = mergeSentOperation
    ? synced.operations.map(op => {
        const optimistic = pendingByHash.get(op.hash);
        return optimistic ? mergeSentOperation(op, optimistic) : op;
      })
    : synced.operations;
  const pendingOperations = synced.pendingOperations.filter(
    op => !syncedHashes.has(op.hash) && !family.isPendingSettled?.(op, synced),
  );

  return { ...synced, operations, pendingOperations };
}

/** The account layer of a multi-address family, for `BridgeApi.accountLayer` (ADR-065). */
export function createMultiAddressAccountLayer<
  Tx extends AccountTransaction,
  State extends MultiAddressAccountState,
>(family: MultiAddressAccountFamily<Tx, State>): AccountLayer {
  return {
    getAccountShape: (info, _syncConfig, dependencies) =>
      getAccountShape(family, info, dependencies),
    completeIntent: async (intent, account, transaction, dependencies) =>
      family.completeIntent(intent, account, transaction, {
        ...dependencies,
        addressBook: addressBookOf(family, account),
      }),
    postSync: (_initial, synced) => postSync(family, synced),
    ...(family.decorateOptimisticOperation
      ? { decorateOptimisticOperation: family.decorateOptimisticOperation }
      : {}),
    ...(family.getSerializedAddressParameters
      ? { getSerializedAddressParameters: family.getSerializedAddressParameters }
      : {}),
  };
}
