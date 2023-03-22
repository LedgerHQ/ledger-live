import invariant from "invariant";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import { BigNumber } from "bignumber.js";
import type {
  GetAccountShape,
  IterateResultBuilder,
} from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";
import type { Result } from "../../hw/getAddress/types";
import { HederaResources, STAKE_METHOD } from "./types";
import { encodeAccountId } from "../../account";

import { getAccountsForPublicKey, getOperationsForAccount, getAccountInfo } from "./api/mirror";
import { getAccountBalance } from "./api/network";
import type { HederaAccount } from "./types";

const getAccountShape: GetAccountShape = async (
  info
): Promise<Partial<HederaAccount>> => {
  const { currency, derivationMode, address, initialAccount } = info;

  invariant(address, "an hedera address is expected");

  const liveAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  // get current account balance
  const accountBalance = await getAccountBalance(address);

  // get account information
  const accountInfo = await getAccountInfo(address);

  // determine what the stake method is depending on whether `accountId` or `nodeId` exists
  const stakeMethod =
    accountInfo.staked_account_id != null
      ? STAKE_METHOD.ACCOUNT
      : accountInfo.staked_node_id != null
      ? STAKE_METHOD.NODE
      : null;

  // extract account staking information
  const hederaResources: HederaResources = {
    staked: {
      accountId: accountInfo.staked_account_id,
      nodeId: accountInfo.staked_node_id,
      declineRewards: accountInfo.decline_reward,
      stakeMethod,
    },
  };

  // grab latest operation's consensus timestamp for incremental sync
  const oldOperations = initialAccount?.operations ?? [];
  const latestOperationTimestamp = oldOperations[0]
    ? Math.floor(oldOperations[0].date.getTime() / 1000)
    : 0;

  // merge new operations w/ previously synced ones
  const newOperations = await getOperationsForAccount(
    liveAccountId,
    address,
    new BigNumber(latestOperationTimestamp).toString()
  );
  const operations = mergeOps(oldOperations, newOperations);

  return {
    id: liveAccountId,
    freshAddress: address,
    balance: accountBalance.balance,
    spendableBalance: accountBalance.balance,
    operations,
    // NOTE: there are no "blocks" in hedera
    // Set a value just so that operations are considered confirmed according to isConfirmedOperation
    blockHeight: 10,
    hederaResources
  };
};

const buildIterateResult: IterateResultBuilder = async ({
  result: rootResult,
}) => {
  const accounts = await getAccountsForPublicKey(rootResult.publicKey);
  const addresses = accounts.map((a) => a.accountId.toString());

  return async ({ currency, derivationMode, index }) => {
    const derivationScheme = getDerivationScheme({
      derivationMode,
      currency,
    });
    const freshAddressPath = runDerivationScheme(derivationScheme, currency, {
      account: index,
    });
    return addresses[index]
      ? ({
          address: addresses[index],
          publicKey: addresses[index],
          path: freshAddressPath,
        } as Result)
      : null;
  };
};

export const scanAccounts = makeScanAccounts({
  getAccountShape,
  buildIterateResult,
});

export const sync = makeSync({ getAccountShape });
