import { pubkeyToAddress, decodeBech32Pubkey } from "@cosmjs/amino";
import { BigNumber } from "bignumber.js";
import { encodeAccountId } from "../../account";
import {
  makeSync,
  makeScanAccounts,
  GetAccountShape,
  mergeOps,
} from "../../bridge/jsHelpers";
import { osmosisAPI } from "./api/sdk";

const accountPubPrefix = "osmopub";
const accountAddressPrefix = "osmo";

const getAccountShape: GetAccountShape = async (info) => {
  const { address, currency, derivationMode, initialAccount } = info;
  let xpubOrAddress = address;

  if (address.match(accountPubPrefix)) {
    const pubkey = decodeBech32Pubkey(address);
    xpubOrAddress = pubkeyToAddress(pubkey as any, accountAddressPrefix);
  }

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress,
    derivationMode,
  });

  const {
    balances,
    blockHeight,
    delegations,
    redelegations,
    unbondings,
    withdrawAddress,
  } = await osmosisAPI.getAccountInfo(xpubOrAddress, currency);

  const oldOperations = initialAccount?.operations || [];

  let operations = oldOperations;

  // For indexer efficiency reasons, only fetch new operations starting from the datetime
  // of the last operation previously fetched
  let lastOperationDate: Date | null = null;
  if (operations.length > 0) {
    operations.forEach((o) => {
      if (o.date != null) {
        if (lastOperationDate !== null) {
          if (o.date.valueOf() > lastOperationDate.valueOf()) {
            lastOperationDate = o.date;
          }
        } else {
          lastOperationDate = o.date;
        }
      }
    });
  }

  const newOperations = await osmosisAPI.getOperations(
    accountId,
    address,
    lastOperationDate
  );

  // Merge new operations with the previously synced ones
  operations = mergeOps(operations, newOperations);

  let balance = balances;
  let delegatedBalance = new BigNumber(0);
  let pendingRewardsBalance = new BigNumber(0);
  let unbondingBalance = new BigNumber(0);

  for (const delegation of delegations) {
    delegatedBalance = delegatedBalance.plus(delegation.amount);
    balance = balance.plus(delegation.amount);

    pendingRewardsBalance = pendingRewardsBalance.plus(
      delegation.pendingRewards
    );
  }

  for (const unbonding of unbondings) {
    unbondingBalance = unbondingBalance.plus(unbonding.amount);
    balance = balance.plus(unbonding.amount);
  }

  let spendableBalance = balance.minus(unbondingBalance.plus(delegatedBalance));

  if (spendableBalance.lt(0)) {
    spendableBalance = new BigNumber(0);
  }

  const shape = {
    id: accountId,
    xpub: xpubOrAddress,
    balance: balance,
    spendableBalance,
    operationsCount: operations.length,
    blockHeight,
    cosmosResources: {
      delegations,
      redelegations,
      unbondings,
      delegatedBalance,
      pendingRewardsBalance,
      unbondingBalance,
      withdrawAddress,
    },
  };

  if (shape.spendableBalance && shape.spendableBalance.lt(0)) {
    shape.spendableBalance = new BigNumber(0);
  }

  return { ...shape, operations };
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });
