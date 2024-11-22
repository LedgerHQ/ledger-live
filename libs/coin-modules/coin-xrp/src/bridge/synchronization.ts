import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { listOperations, parseAPIValue } from "../logic";
import { getAccountInfo, getServerInfos } from "../network";
import { ServerInfoResponse } from "../network/types";
import { AccountInfo } from "../types";

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

  if (accountInfo.isNewAccount) {
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

  const oldOperations = initialAccount?.operations || [];
  const startAt = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;

  const serverInfo = await getServerInfos();
  const ledgers = serverInfo.info.complete_ledgers.split("-");
  const maxLedgerVersion = Number(ledgers[1]);

  const balance = new BigNumber(accountInfo.balance);
  const spendableBalance = await calculateSpendableBalance(accountInfo, serverInfo);

  const newOperations = await filterOperations(accountId, address, startAt);

  const operations = mergeOps(oldOperations, newOperations);

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

async function filterOperations(
  accountId: string,
  address: string,
  startAt: number,
): Promise<Operation[]> {
  const operations = await listOperations(address, startAt);

  return operations.map(
    op =>
      ({
        id: encodeOperationId(accountId, op.hash, op.simpleType),
        hash: op.hash,
        accountId,
        type: op.simpleType,
        value: new BigNumber(op.value.toString()),
        fee: new BigNumber(op.fee.toString()),
        blockHash: null,
        blockHeight: op.blockHeight,
        senders: op.senders,
        recipients: op.recipients,
        date: op.date,
        transactionSequenceNumber: op.transactionSequenceNumber,
        extra: {},
      }) satisfies Operation,
  );
}

async function calculateSpendableBalance(
  account: AccountInfo,
  serverInfo: ServerInfoResponse,
): Promise<BigNumber> {
  const reserveMinXRP = parseAPIValue(serverInfo.info.validated_ledger.reserve_base_xrp.toString());
  const reservePerTrustline = parseAPIValue(
    serverInfo.info.validated_ledger.reserve_inc_xrp.toString(),
  );
  const trustlines = account.ownerCount;

  const spendableBalance = new BigNumber(account.balance)
    .minus(reserveMinXRP)
    .minus(reservePerTrustline.times(trustlines));

  return spendableBalance;
}
