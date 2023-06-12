import BigNumber from "bignumber.js";
import { getAccountInfo, getServerInfo, getTransactions } from "./api";
import { GetAccountShape, makeScanAccounts, makeSync, mergeOps } from "../../bridge/jsHelpers";
import { encodeOperationId } from "../../operation";
import { Account, Operation } from "@ledgerhq/types-live";
import { encodeAccountId } from "../../account";
import { NEW_ACCOUNT_ERROR_MESSAGE } from "./bridge/js";
import { TxXRPL } from "./types.api";

const txToOperation =
  (accountId: string, address: string) =>
  ({
    meta: { delivered_amount },
    tx: { DestinationTag, Fee, hash, inLedger, date, Account, Destination, Sequence },
  }: TxXRPL): Operation | null | undefined => {
    const type = Account === address ? "OUT" : "IN";
    let value =
      delivered_amount && typeof delivered_amount === "string"
        ? new BigNumber(delivered_amount)
        : new BigNumber(0);
    const feeValue = new BigNumber(Fee);

    if (type === "OUT") {
      if (!Number.isNaN(feeValue)) {
        value = value.plus(feeValue);
      }
    }

    // https://xrpl.org/basic-data-types.html#specifying-time
    const toEpochDate = (946684800 + date) * 1000;

    const op: Operation = {
      id: encodeOperationId(accountId, hash, type),
      hash: hash,
      accountId: accountId,
      type,
      value,
      fee: feeValue,
      blockHash: null,
      blockHeight: inLedger,
      senders: [Account],
      recipients: [Destination],
      date: new Date(toEpochDate),
      transactionSequenceNumber: Sequence,
      extra: {},
    };

    if (DestinationTag) {
      op.extra.tag = DestinationTag;
    }

    return op;
  };

const filterOperations: any = (transactions: TxXRPL[], accountId: string, address: string) => {
  return transactions
    .filter(
      (tx: TxXRPL) =>
        tx.tx.TransactionType === "Payment" && typeof tx.meta.delivered_amount === "string",
    )
    .map(txToOperation(accountId, address))
    .filter(Boolean);
};

const getAccountShape: GetAccountShape = async (info): Promise<Partial<Account>> => {
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

  const serverInfo = await getServerInfo();

  const oldOperations = initialAccount?.operations || [];
  const startAt = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;

  const ledgers = serverInfo.info.complete_ledgers.split("-");
  const minLedgerVersion = Number(ledgers[0]);
  const maxLedgerVersion = Number(ledgers[1]);

  const balance = new BigNumber(accountInfo.account_data.Balance);

  const newTransactions =
    (await getTransactions(address, {
      ledger_index_min: Math.max(
        startAt, // if there is no ops, it might be after a clear and we prefer to pull from the oldest possible history
        minLedgerVersion,
      ),
      ledger_index_max: maxLedgerVersion,
    })) || [];

  const newOperations = filterOperations(newTransactions, accountId, address);

  const operations = mergeOps(oldOperations, newOperations as Operation[]);

  const shape = {
    id: accountId,
    xpub: address,
    blockHeight: maxLedgerVersion,
    balance,
    spendableBalance: balance,
    operations,
    operationsCount: operations.length,
  };

  return shape;
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });
