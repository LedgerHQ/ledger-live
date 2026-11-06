import BigNumber from "bignumber.js";
import type { Account as WalletAPIAccount, AccountReadiness } from "@ledgerhq/wallet-api-core";
import type { AccountEntry } from "@domain/entity-account";
import type { AccountAssetBalance } from "@domain/entity-account-balance";
import type { AccountReceive } from "@domain/entity-account-receive";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import { walletApiAccountIdOf, walletApiTokenAccountIdOf } from "./walletApiAccountId";

/** Whether a live app may see an account of `currencyId`, a token's parent being `parentCurrencyId`. */
export type WalletAPIAccountFilter = (currencyId: string, parentCurrencyId: string) => boolean;

/** What the entities hold about one account. */
export type WalletAPIAccountInputs = {
  entry: AccountEntry;
  name: string;
  balances: AccountAssetBalance[];
  receive: AccountReceive | undefined;
  /** When the balances were read, in ms since epoch: the protocol calls it the last sync. */
  readAt: number | undefined;
  /** By token id, for the token account names. */
  tickers: Partial<Record<string, string>>;
};

const addressOf = ({ entry, receive }: WalletAPIAccountInputs): string => {
  if (receive?.status === "ready") return receive.address;
  return entry.descriptor.type === "address" ? entry.descriptor.address : "";
};

/** The protocol's readiness is about sending; the entities only know an account that cannot receive yet. */
const readinessOf = ({ receive }: WalletAPIAccountInputs): AccountReadiness | undefined =>
  receive?.status === "onboardingRequired"
    ? { ready: false, reason: "activationRequired" }
    : undefined;

const ZERO = { balance: "0", spendableBalance: "0" };

/** The account and each of its tokens, as Wallet API accounts: the token rows of the balance become token accounts. */
export function toWalletAPIAccounts(
  inputs: WalletAPIAccountInputs,
  filter: WalletAPIAccountFilter = () => true,
): WalletAPIAccount[] {
  const { entry, name, balances, readAt, tickers } = inputs;
  const currencyId = currencyIdFromNetwork(entry.descriptor.network);
  const id = walletApiAccountIdOf(entry);
  const shared = {
    address: addressOf(inputs),
    blockHeight: undefined,
    lastSyncDate: new Date(readAt ?? 0),
  };
  const readiness = readinessOf(inputs);
  const native = balances.find(row => row.assetId === currencyId) ?? ZERO;

  const parent: WalletAPIAccount = {
    ...shared,
    id,
    name,
    currency: currencyId,
    balance: new BigNumber(native.balance),
    spendableBalance: new BigNumber(native.spendableBalance),
    ...(readiness && { readiness }),
  };

  const tokens = balances
    .filter(row => row.assetId !== currencyId)
    .map((row): WalletAPIAccount => ({
      ...shared,
      id: walletApiTokenAccountIdOf(entry, row.assetId),
      parentAccountId: id,
      name: `${name} (${tickers[row.assetId] ?? row.assetId})`,
      currency: row.assetId,
      balance: new BigNumber(row.balance),
      spendableBalance: new BigNumber(row.spendableBalance),
      ...(readiness && { readiness }),
    }));

  return [parent, ...tokens].filter(account => filter(account.currency, currencyId));
}
