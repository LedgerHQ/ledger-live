import invariant from "invariant";
import {
  getDerivationScheme,
  Result,
  runDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { getAccountsForPublicKey, getOperationsForAccount } from "./api/mirror";
import {
  GetAccountShape,
  IterateResultBuilder,
  mergeOps,
} from "@ledgerhq/coin-framework/lib/bridge/jsHelpers";
import { encodeAccountId } from "@ledgerhq/coin-framework/account";
import { getAccountBalance } from "./api/network";

export const getAccountShape: GetAccountShape<Account> = async (
  info: any,
): Promise<Partial<Account>> => {
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

  // grab latest operation's consensus timestamp for incremental sync
  const oldOperations = initialAccount?.operations ?? [];
  const latestOperationTimestamp = oldOperations[0]
    ? Math.floor(oldOperations[0].date.getTime() / 1000)
    : 0;

  // merge new operations w/ previously synced ones
  const newOperations = await getOperationsForAccount(
    liveAccountId,
    address,
    new BigNumber(latestOperationTimestamp).toString(),
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
  };
};

export const buildIterateResult: IterateResultBuilder = async ({ result: rootResult }) => {
  const accounts = await getAccountsForPublicKey(rootResult.publicKey);
  const addresses = accounts.map(a => a.accountId.toString());

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

// export const scanAccounts = makeScanAccounts({
//   getAccountShape,
//   buildIterateResult,
// });

// export const sync = makeSync({ getAccountShape });
