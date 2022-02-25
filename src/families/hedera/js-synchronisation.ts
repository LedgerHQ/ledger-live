import { $Shape } from "utility-types";
import { BigNumber } from "bignumber.js";
import { AccountId } from "@hashgraph/sdk";

import type { Account } from "../../types";
import type {
  GetAccountShape,
  GetAddressesFromPubkey,
} from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";
import { encodeAccountId } from "../../account";

import { getAccountsForPublicKey, getOperationsForAccount } from "./api/mirror";
import { getAccountBalance } from "./api/network";

const getAccountShape: GetAccountShape = async (
  info
): Promise<Partial<Account>> => {
  const { currency, derivationMode, address, initialAccount } = info;

  const liveAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    // FIXME Make sure this is enough
    // TODO Even if enough, maybe better to have pubkey+address?
    xpubOrAddress: address,
    // Custom Hedera account identifier
    //xpubOrAddress: `${res.publicKey}+${account.accountId.toString()}`,
    derivationMode,
  });

  const hederaAccountId = AccountId.fromString(address);

  // get current account balance
  const accountBalance = await getAccountBalance(hederaAccountId);

  // grab latest operation's consensus timestamp for incremental sync
  const oldOperations = initialAccount?.operations ?? [];
  const latestOperationTimestamp =
    oldOperations[0]?.extra?.consensus_timestamp ?? 0;

  // merge new operations w/ previously synced ones
  const newOperations = await getOperationsForAccount(
    liveAccountId,
    hederaAccountId,
    latestOperationTimestamp
  );
  const operations = mergeOps(oldOperations, newOperations);

  const shape = {
    id: liveAccountId,
    freshAddress: address,
    balance: accountBalance.balance,
    spendableBalance: accountBalance.balance,
    operations,
    // NOTE: there are no "blocks" in hedera
    // Set a value just so that operations are considered confirmed according to isConfirmedOperation
    blockHeight: 10,
  };

  return shape;
};

const getAddressesFromPubkey: GetAddressesFromPubkey = async (
  pubkey: string
) => {
  // use a mirror node to ask for any accounts that have this public key registered
  const accounts = await getAccountsForPublicKey(pubkey);

  return accounts.map((a) => a.accountId.toString());
};

export const scanAccounts = makeScanAccounts({
  getAccountShape,
  getAddressesFromPubkey,
});

export const sync = makeSync({ getAccountShape });
