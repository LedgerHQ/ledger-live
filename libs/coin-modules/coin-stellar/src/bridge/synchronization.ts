import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { inferSubOperations } from "@ledgerhq/coin-framework/serialization/index";
import { Account } from "@ledgerhq/types-live";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { fetchAccount, fetchAllOperations } from "../network";
import { buildSubAccounts } from "./tokens";
import { StellarBurnAddressError, StellarOperation } from "../types";
import { STELLAR_BURN_ADDRESS } from "./logic";
import { getEnv } from "@ledgerhq/live-env";

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
  const lastPagingToken = oldOperations[0]?.extra.pagingToken || "";
  const isInitSync = lastPagingToken === "";

  const newOperations =
    (await fetchAllOperations(
      accountId,
      address,
      isInitSync ? "desc" : "asc",
      lastPagingToken,
      // For an account with a particularly high number of historical transactions,
      // retrieving all the data would take a considerable amount of time and is likely to
      // fail due to poor network connection quality or other reasons. Therefore, we set a
      // limit on the number of retrieval operations here.
      // If users want to access historical records from earlier, I would suggest they use a professional blockchain explorer.
      isInitSync ? getEnv("API_STELLAR_HORIZON_INITIAL_FETCH_MAX_OPERATIONS") : undefined,
    )) || [];

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
