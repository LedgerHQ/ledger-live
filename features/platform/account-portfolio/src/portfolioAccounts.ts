import {
  registrationKey,
  registrationOf,
  type BalanceEntry,
  type BalanceGroup,
  type Portfolio,
  type PortfolioAccount,
  type PortfolioRegistration,
} from "@domain/api-account-portfolio";
import type { AccountDescriptor, AccountUUID } from "@domain/entity-account-descriptor";

/** A wallet account, with the addresses it is known by besides its descriptor's. */
export type PortfolioWalletAccount = {
  readonly accountUUID: AccountUUID;
  readonly descriptor: AccountDescriptor;
  readonly addresses: readonly string[];
};

export type PortfolioBalanceLine = {
  readonly asset: string;
  readonly ticker: string;
  /** In the asset's smallest unit. */
  readonly amount: string;
  readonly decimals: number;
  /** In major units of the snapshot currency; null when the service has no rate. */
  readonly currencyValue: number | null;
  /** The service holds an unconfirmed amount for this asset. */
  readonly pending: boolean;
};

export type PortfolioServiceAccount = {
  readonly id: string;
  readonly network: string;
  readonly status: PortfolioAccount["status"];
  /** Only set when a registration or an address ties the service account to a wallet account. */
  readonly accountUUID: AccountUUID | undefined;
  readonly balances: readonly PortfolioBalanceLine[];
  /** Sum of the priced balances; null when none is priced. */
  readonly value: number | null;
  readonly error: string | undefined;
};

export type WalletRegistrations = {
  readonly registrations: PortfolioRegistration[];
  /** Wallet accounts no registration strategy covers. */
  readonly skippedCount: number;
};

export function walletRegistrations(
  walletAccounts: readonly PortfolioWalletAccount[],
): WalletRegistrations {
  const registrations: PortfolioRegistration[] = [];
  for (const { descriptor } of walletAccounts) {
    const registration = registrationOf(descriptor);
    if (registration) registrations.push(registration);
  }
  return { registrations, skippedCount: walletAccounts.length - registrations.length };
}

/** The service repeats an unchanged balance as both confirmed and pending: count it once. */
function mergeBalanceItems(items: readonly BalanceEntry[]): PortfolioBalanceLine[] {
  const groups = new Map<string, { confirmed?: BalanceEntry; pending?: BalanceEntry }>();
  for (const item of items) {
    const key = `${item.asset}:${item.locked}`;
    const group = groups.get(key) ?? {};
    if (item.status === "confirmed") group.confirmed ??= item;
    else group.pending ??= item;
    groups.set(key, group);
  }
  return [...groups.values()].flatMap(({ confirmed, pending }) => {
    const chosen = confirmed ?? pending;
    if (!chosen) return [];
    return [
      {
        asset: chosen.asset,
        ticker: chosen.ticker,
        amount: chosen.amount,
        decimals: chosen.decimals,
        currencyValue: chosen.currency_value ?? null,
        pending: !confirmed || (pending !== undefined && pending.amount !== confirmed.amount),
      },
    ];
  });
}

const sameAddress = (serviceId: string, address: string) =>
  serviceId.toLowerCase() === address.toLowerCase() ||
  serviceId.toLowerCase().endsWith(`:${address.toLowerCase()}`);

function addressesOf({ descriptor, addresses }: PortfolioWalletAccount): string[] {
  const own = descriptor.type === "address" ? [descriptor.address] : [];
  return [...own, ...addresses].filter(address => address.length > 0);
}

/**
 * Ties service accounts to wallet accounts through what proves it: the registration the service
 * echoes under the account id, or an address of the account in the service id. A service account
 * nothing proves stays unowned rather than guessed.
 */
function walletOwners(
  accounts: readonly PortfolioAccount[],
  registrations: Portfolio["registrations"],
  walletAccounts: readonly PortfolioWalletAccount[],
): Map<string, AccountUUID> {
  const byKey = new Map<string, AccountUUID>();
  for (const wallet of walletAccounts) {
    const registration = registrationOf(wallet.descriptor);
    const key = registration ? registrationKey(registration) : undefined;
    if (key && !byKey.has(key)) byKey.set(key, wallet.accountUUID);
  }
  const byRegistrationId = new Map<string, AccountUUID>();
  for (const entry of registrations ?? []) {
    const key = registrationKey(entry);
    const owner = key ? byKey.get(key) : undefined;
    if (owner) byRegistrationId.set(entry.id, owner);
  }

  const owners = new Map<string, AccountUUID>();
  const claimed = new Set<AccountUUID>();
  const claim = (serviceId: string, owner: AccountUUID) => {
    if (owners.has(serviceId) || claimed.has(owner)) return;
    owners.set(serviceId, owner);
    claimed.add(owner);
  };
  for (const account of accounts) {
    const owner = byRegistrationId.get(account.id);
    if (owner) claim(account.id, owner);
  }
  for (const account of accounts) {
    if (owners.has(account.id)) continue;
    const wallet = walletAccounts.find(
      candidate =>
        !claimed.has(candidate.accountUUID) &&
        candidate.descriptor.network === account.network &&
        addressesOf(candidate).some(address => sameAddress(account.id, address)),
    );
    if (wallet) claim(account.id, wallet.accountUUID);
  }
  return owners;
}

export function portfolioServiceAccounts(
  portfolio: Portfolio,
  groups: readonly BalanceGroup[],
  walletAccounts: readonly PortfolioWalletAccount[],
): PortfolioServiceAccount[] {
  const accounts = portfolio.accounts ?? [];
  const owners = walletOwners(accounts, portfolio.registrations, walletAccounts);
  const groupsByAccount = new Map<string, BalanceGroup[]>();
  for (const group of groups) {
    groupsByAccount.set(group.account_id, [
      ...(groupsByAccount.get(group.account_id) ?? []),
      group,
    ]);
  }
  return accounts.map(account => {
    const related = groupsByAccount.get(account.id) ?? [];
    const balances = related.flatMap(group =>
      "items" in group ? mergeBalanceItems(group.items) : [],
    );
    const priced = balances.flatMap(line =>
      line.currencyValue === null ? [] : [line.currencyValue],
    );
    const failure = related.find(group => "error" in group);
    return {
      id: account.id,
      network: account.network,
      status: account.status,
      accountUUID: owners.get(account.id),
      balances,
      value: priced.length > 0 ? priced.reduce((sum, value) => sum + value, 0) : null,
      error: failure && "error" in failure ? failure.error : undefined,
    };
  });
}

export function portfolioTotal(accounts: readonly PortfolioServiceAccount[]): number {
  return accounts.reduce((sum, account) => sum + (account.value ?? 0), 0);
}

const SETTLED_STATUSES: ReadonlySet<PortfolioAccount["status"]> = new Set([
  "synchronized",
  "registration_failure",
]);

/** The service is still indexing what was registered. */
export function isPortfolioSyncing(portfolio: Portfolio, registeredCount: number): boolean {
  if (registeredCount === 0) return false;
  const accounts = portfolio.accounts ?? [];
  return accounts.length === 0 || accounts.some(account => !SETTLED_STATUSES.has(account.status));
}
