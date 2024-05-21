import BigNumber from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getAccountInfo, getServerInfos, getTransactions, parseAPIValue } from "./api";
import { NEW_ACCOUNT_ERROR_MESSAGE, filterOperations } from "./logic";

export const getAccountShape: GetAccountShape = async info => {
  const { address, initialAccount, currency, derivationMode } = info;
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  const accountInfo = await getAccountInfo(address);

  if (!accountInfo || accountInfo.error === NEW_ACCOUNT_ERROR_MESSAGE) {
    return {
      id: accountId,
      xpub: address,
      blockHeight: 0,
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
      operations: [],
      operationsCount: 0,
    };
  }

  const serverInfo = await getServerInfos();
  const reserveMinXRP = parseAPIValue(serverInfo.info.validated_ledger.reserve_base_xrp.toString());
  const reservePerTrustline = parseAPIValue(
    serverInfo.info.validated_ledger.reserve_inc_xrp.toString(),
  );

  const oldOperations = initialAccount?.operations || [];
  const startAt = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;

  const ledgers = serverInfo.info.complete_ledgers.split("-");
  const minLedgerVersion = Number(ledgers[0]);
  const maxLedgerVersion = Number(ledgers[1]);

  const trustlines = accountInfo.account_data.OwnerCount;

  const balance = new BigNumber(accountInfo.account_data.Balance);
  const spendableBalance = new BigNumber(accountInfo.account_data.Balance)
    .minus(reserveMinXRP)
    .minus(reservePerTrustline.times(trustlines));

  const newTransactions = await getTransactions(address, {
    ledger_index_min: Math.max(
      startAt, // if there is no ops, it might be after a clear and we prefer to pull from the oldest possible history
      minLedgerVersion,
    ),
    ledger_index_max: maxLedgerVersion,
  });
  const newOperations = filterOperations(newTransactions, accountId, address);

  const operations = mergeOps(oldOperations, newOperations as Operation[]);

  const shape = {
    id: accountId,
    xpub: address,
    blockHeight: maxLedgerVersion,
    balance,
    spendableBalance,
    operations,
    operationsCount: operations.length,
  };

  return shape;
};
