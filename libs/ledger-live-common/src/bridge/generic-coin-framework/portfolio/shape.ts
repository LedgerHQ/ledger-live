import BigNumber from "bignumber.js";
import {
  compareNewestFirst,
  fromJsonOperation,
  type JsonOperation,
} from "@ledgerhq/account-module-framework";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountModuleBinding, BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { log } from "@ledgerhq/logs";
import {
  isUnsupported,
  requireExtension,
  type AccountBalances,
  type BalanceEntry,
  type OperationView,
  type PageView,
  type UpdateView,
} from "@ledgerhq/portfolio-module-framework";
import type { Account, OperationExtra, OperationExtraRaw, SyncConfig } from "@ledgerhq/types-live";
import { accountPathFrom, toLiveOperation } from "../accountModule";
import { assembleAccountShape } from "../assembly";
import { listedOperations } from "../assembly/operations";
import { addressAccountId } from "../assembly/syncHash";
import { readsValidators, toValidatorItems } from "../assembly/validators";
import { portfolioChainReads } from "../chainReads";
import { readFamilyData } from "../familyReads";
import type { OperationHistoryBound } from "../operationHistoryBound";
import type { CoinFrameworkSigner, OperationCommon } from "../types";
import { adaptCoreOperationToLiveOperation } from "../utils";
import {
  isSeeded,
  openAccountPortfolio,
  type AccountPortfolio,
  type PortfolioAccountSource,
} from "./account";
import { syncErrorFromView } from "./errors";
import { UNBOUNDED_HISTORY } from "./listing";
import { balancesFromEntries, coreOperationFromView, fromUtxoView, withCalIds } from "./models";

/**
 * Every item of a paged read, its pages followed to the end. A token already followed ends the
 * read: a cursor going round would never end it. An empty page does not: a page may hold nothing
 * the reader sees and still go on.
 */
export async function allItems<T>(
  read: (token: string | undefined) => Promise<PageView<T>>,
): Promise<T[]> {
  const items: T[] = [];
  const followed = new Set<string>();
  let token: string | undefined;
  for (;;) {
    const page = await read(token);
    items.push(...(page.items ?? []));
    const next = page.nextToken || undefined;
    if (next === undefined) return items;
    if (followed.has(next)) {
      log("generic-coin-framework", "portfolio read stopped on a page token already followed", {
        token: next,
      });
      return items;
    }
    followed.add(next);
    token = next;
  }
}

/** The balance entries of the accounts read; an account whose balances failed fails the read. */
export function successItems(balances: AccountBalances[]): BalanceEntry[] {
  return balances.flatMap(accountBalances => {
    if (accountBalances.type === "failure") throw new Error(accountBalances.error);
    return accountBalances.items ?? [];
  });
}

/** The account a sync or a scan reads: its key read on the device when the scan finds a new one. */
async function shapeSource(
  info: AccountShapeInfo,
  bridgeApi: BridgeApi,
  signer: CoinFrameworkSigner | undefined,
): Promise<PortfolioAccountSource> {
  const { currency, index, derivationPath, derivationMode, deviceId, initialAccount } = info;
  const binding = bridgeApi.accountModule;
  if (!binding) {
    return {
      currency,
      accountId: addressAccountId(info, bridgeApi),
      key: info.address,
      derivationMode,
      // A sync passes the seed identifier path, not the address path: the account keeps its own.
      derivationPath: initialAccount?.freshAddressPath ?? derivationPath,
      index,
      account: initialAccount,
    };
  }

  const accountPath = accountPathFrom(derivationPath, index);
  let key: string;
  if (initialAccount) {
    key = decodeAccountId(initialAccount.id).xpubOrAddress;
  } else {
    if (!signer) throw new Error(`No signer to scan ${currency.id} accounts`);
    key = await binding.getAccountKey(
      { currencyId: currency.id, derivationPath: accountPath, derivationMode, deviceId },
      signer.context,
    );
  }
  return {
    currency,
    accountId: encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: key,
      derivationMode,
    }),
    key,
    derivationMode,
    derivationPath: accountPath,
    index,
    account: initialAccount,
  };
}

const operationsOf = (updates: UpdateView[]): OperationView[] =>
  updates.map(({ operation }) => operation as OperationView);

/** The local side reads its whole history once per page: one page holds it all. */
const pageOf = ({ readSide }: AccountPortfolio) =>
  readSide === "local" ? { size: Number.MAX_SAFE_INTEGER } : {};

/**
 * The account of a family served by an account module, with the fields legacy
 * `getAccountModuleShape` gives it: its native balance, every operation of its history, its fresh
 * address and synced height, and the family fields the binding reads from the module state Ledger
 * Wallet stores and the outputs the portfolio answers (none when it serves none). No sub-account,
 * no `syncHash`, no tip read.
 */
async function bindingPortfolioShape(
  binding: AccountModuleBinding,
  source: PortfolioAccountSource,
  opened: AccountPortfolio,
): Promise<Partial<Account>> {
  const { reader, store, portfolioId, network } = opened;
  const { accountId, key } = source;
  const page = pageOf(opened);
  const [entries, updates, fresh, stored] = await Promise.all([
    allItems(token => reader.getPortfolioBalance(portfolioId, { network, ...page, token })),
    allItems(token => reader.getUpdates(portfolioId, { network, order: "DESC", ...page, token })),
    requireExtension(reader, "getFreshAddress")(portfolioId, accountId),
    store.get(portfolioId),
  ]);
  const state = stored?.accounts.find(({ id }) => id === accountId)?.state;
  const fields = await binding.accountFields({
    key,
    state,
    // None when the account's module keeps no outputs, as on the legacy path.
    getUTXOs: async () => {
      try {
        const { items } = await requireExtension(reader, "getAccountUtxos")(portfolioId, accountId);
        return items.map(fromUtxoView);
      } catch (error) {
        if (isUnsupported(error)) return [];
        throw error;
      }
    },
  });

  const native = balancesFromEntries(successItems(entries)).balances.find(
    ({ asset }) => asset.type === "native",
  );
  const balance = new BigNumber((native?.value ?? 0n).toString());
  const operations = operationsOf(updates)
    .map(op => fromJsonOperation(op as JsonOperation))
    .filter(op => !op.optimistic)
    .sort(compareNewestFirst)
    .map(op => toLiveOperation(binding, accountId, op));
  const blockHeight = binding.syncedHeight(state);

  return {
    id: accountId,
    balance,
    spendableBalance: balance.minus((native?.locked ?? 0n).toString()),
    operations,
    operationsCount: operations.length,
    freshAddress: fresh.address,
    freshAddressPath: fresh.derivation_path,
    ...(blockHeight === undefined ? {} : { blockHeight }),
    ...fields,
  };
}

/**
 * The shape of an account served by the portfolio layer. The portfolio syncs it, then the account
 * is assembled as the legacy path assembles it (`assembleAccountShape`), from the portfolio's
 * models instead of the coin module: the network's balance list, the operations this sync listed
 * (not the ones Ledger Wallet seeded, nor the optimistic ones), the tip, the validators, and what
 * the family hooks read through the portfolio's chain reads. A family served by an account module
 * gets the fields of legacy `getAccountModuleShape` instead.
 *
 * The operation history bound applies as on the legacy path: the local side lists under it
 * (`boundedListingModule`), and the assembly bounds what the account stores. A listing the service
 * serves is not cut by the walk bound, only by the store bound.
 *
 * A failed sync fails as the legacy path fails, while the local side serves the reads; while the
 * service does, the failure of the hidden local twin is logged and the service's reads answer.
 */
export async function getPortfolioAccountShape(
  info: AccountShapeInfo,
  syncConfig: SyncConfig,
  {
    bridgeApi,
    coinModuleApi,
    context,
    signer,
    reviveFamilyExtra,
    bound = UNBOUNDED_HISTORY,
  }: {
    bridgeApi: BridgeApi;
    coinModuleApi: CoinModuleApi<any, any, any>;
    context: Context<any>;
    signer: CoinFrameworkSigner | undefined;
    reviveFamilyExtra?: (extraRaw: OperationExtraRaw) => OperationExtra;
    /** The operation history bound of the currency (`resolveOperationHistoryBound`); none by default. */
    bound?: OperationHistoryBound;
  },
): Promise<Partial<Account>> {
  const binding = bridgeApi.accountModule;
  const source = await shapeSource(info, bridgeApi, signer);
  const opened = await openAccountPortfolio(
    source,
    { binding, coinModuleApi, context, bridgeApi },
    "read",
    { syncConfig, bound },
  );
  const { portfolio, reader, portfolioId, network, readSide, syncHash } = opened;

  await portfolio.sync(portfolioId);
  const failure = (await reader.getPortfolio(portfolioId)).accounts?.find(
    ({ id }) => id === source.accountId,
  )?.error;
  if (failure) {
    const error = await syncErrorFromView(failure, info.currency, context, { binding: !!binding });
    if (readSide === "local") throw error;
    // The service serves the reads: the twin's last state still tells its account reads.
    log("generic-coin-framework", `The local twin of a ${network} account failed to sync`, {
      error,
    });
  }

  if (binding) return bindingPortfolioShape(binding, source, opened);

  const chain = portfolioChainReads({ portfolio, network });
  const page = pageOf(opened);
  const [entries, updates, block, validators, family] = await Promise.all([
    allItems(token => reader.getPortfolioBalance(portfolioId, { network, ...page, token })),
    allItems(token => reader.getUpdates(portfolioId, { network, order: "DESC", ...page, token })),
    reader.getLastBlock(network),
    readsValidators(bridgeApi)
      ? reader
          .getValidators(network)
          .then(({ items }) => toValidatorItems(items ?? []))
          .catch(() => [])
      : [],
    readFamilyData(bridgeApi, chain, info.currency, info.address),
  ]);

  const newOperations = listedOperations(
    operationsOf(updates)
      .filter(op => !op.optimistic && !isSeeded(op))
      .map(coreOperationFromView),
  ).map(op =>
    adaptCoreOperationToLiveOperation(source.accountId, op, reviveFamilyExtra),
  ) as OperationCommon[];
  const { balances, calIds } = balancesFromEntries(successItems(entries));

  return assembleAccountShape(
    {
      info,
      syncConfig,
      bridgeApi,
      chain,
      accountId: source.accountId,
      // A read always computes it.
      syncHash: syncHash as string,
      getTokenFromAsset: withCalIds(opened.getTokenFromAsset, calIds),
      maxOperations: bound.maxOperations,
    },
    {
      balances,
      newOperations,
      // Only the local side's listing walks under the bound.
      bounded: readSide === "local" && opened.walk.bounded,
      tipHeight: block.height,
      validators,
      family,
    },
  );
}
