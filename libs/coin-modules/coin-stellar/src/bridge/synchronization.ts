import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { inferSubOperations } from "@ledgerhq/coin-framework/serialization/index";
import { Account } from "@ledgerhq/types-live";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { fetchAccount, fetchAllOperations } from "../network";
import { buildSubAccounts } from "./tokens";
import { StellarBurnAddressError, StellarOperation } from "../types";
import { STELLAR_BURN_ADDRESS } from "./logic";

export const getAccountShape: GetAccountShape<Account> = async (info, syncConfig) => {
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

  const oldOperations = (initialAccount?.operations || []) as StellarOperation[];

  const newOperations =
    (await fetchAllOperations({
      accountId,
      addr: address,
      order: "asc",
      cursor: oldOperations[0]?.extra.pagingToken,
    })) || [];

  const allOperations = mergeOps(oldOperations, newOperations) as StellarOperation[];
  const assetOperations: StellarOperation[] = [];

  allOperations.forEach(operation => {
    if (
      operation?.extra?.assetCode &&
      operation?.extra?.assetIssuer &&
      !["OPT_IN", "OPT_OUT"].includes(operation.type)
    ) {
      assetOperations.push(operation);
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
