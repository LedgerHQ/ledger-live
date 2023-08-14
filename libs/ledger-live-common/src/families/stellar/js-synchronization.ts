import type { Operation } from "@ledgerhq/types-live";
import { encodeAccountId } from "../../account";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeScanAccounts, makeSync, mergeOps } from "../../bridge/jsHelpers";
import { fetchAccount, fetchOperations } from "./api";
import { buildSubAccounts } from "./tokens";
import { inferSubOperations } from "../../account";
import { STELLAR_BURN_ADDRESS } from "./logic";
import { StellarBurnAddressError } from "./errors";

const getAccountShape: GetAccountShape = async (info, syncConfig) => {
  const { address, currency, initialAccount, derivationMode } = info;

  // FIXME Workaround for burn address, see https://ledgerhq.atlassian.net/browse/LIVE-4014
  if (address === STELLAR_BURN_ADDRESS) throw new StellarBurnAddressError();

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  const { blockHeight, balance, spendableBalance, assets } = await fetchAccount(address);

  const oldOperations = initialAccount?.operations || [];
  const lastPagingToken = oldOperations[0]?.extra?.pagingToken || 0;

  const newOperations =
    (await fetchOperations({
      accountId,
      addr: address,
      order: "asc",
      cursor: lastPagingToken,
    })) || [];

  const allOperations = mergeOps(oldOperations, newOperations);
  const assetOperations: Operation[] = [];

  allOperations.forEach(op => {
    if (
      op?.extra?.assetCode &&
      op?.extra?.assetIssuer &&
      !["OPT_IN", "OPT_OUT"].includes(op.type)
    ) {
      assetOperations.push(op);
    }
  });

  const subAccounts =
    buildSubAccounts({
      currency,
      accountId,
      assets,
      syncConfig,
      operations: assetOperations,
    }) || [];

  const shape = {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: allOperations.length,
    blockHeight,
    subAccounts,
  };
  return {
    ...shape,
    operations: allOperations.map(op => {
      const subOperations = inferSubOperations(op.hash, subAccounts);

      return {
        ...op,
        subOperations,
      };
    }),
  };
};

export const sync = makeSync({ getAccountShape });
export const scanAccounts = makeScanAccounts({ getAccountShape });
