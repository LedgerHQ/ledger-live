import invariant from "invariant";
import {
  getDerivationScheme,
  Result,
  runDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { getAccount, getAccountsForPublicKey, getOperationsForAccount } from "../api/mirror";
import {
  GetAccountShape,
  IterateResultBuilder,
  mergeOps,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeAccountId } from "@ledgerhq/coin-framework/account";
import { HederaAccount } from "../types";
import { applyPendingExtras } from "./utils";

export const getAccountShape: GetAccountShape<Account> = async (
  info,
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
  const mirrorAccount = await getAccount(address);
  const accountBalance = new BigNumber(mirrorAccount.balance.balance);

  // grab latest operation's consensus timestamp for incremental sync
  const oldOperations = initialAccount?.operations ?? [];
  const pendingOperations = initialAccount?.pendingOperations ?? [];
  const latestOperationTimestamp = oldOperations[0]
    ? new BigNumber(Math.floor(oldOperations[0].date.getTime() / 1000))
    : null;

  // merge new operations w/ previously synced ones
  const newOperations = await getOperationsForAccount(
    liveAccountId,
    address,
    latestOperationTimestamp ? latestOperationTimestamp.toString() : null,
  );
  const enrichedNewOperations = applyPendingExtras(newOperations, pendingOperations);
  const operations = mergeOps(oldOperations, enrichedNewOperations);

  const delegation =
    typeof mirrorAccount.staked_node_id === "number"
      ? {
          nodeId: mirrorAccount.staked_node_id,
          delegated: accountBalance,
          pendingReward: new BigNumber(mirrorAccount.pending_reward),
        }
      : null;

  return {
    id: liveAccountId,
    freshAddress: address,
    balance: accountBalance,
    spendableBalance: accountBalance,
    operations,
    // NOTE: there are no "blocks" in hedera
    // Set a value just so that operations are considered confirmed according to isConfirmedOperation
    blockHeight: 10,
    hederaResources: {
      delegation,
    },
  };
};

export const buildIterateResult: IterateResultBuilder = async ({ result: rootResult }) => {
  const accounts = await getAccountsForPublicKey(rootResult.publicKey);
  const addresses = accounts.map(a => a.account);

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
