import type { Operation } from "@ledgerhq/coin-module-framework/api/index";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { mergeOps, AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { GetAccountShape } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import BigNumber from "bignumber.js";
import { getAccount, getCurrentBlockHeight } from "./network/indexer";
import { getDelegation } from "./api/node";
import { convertICXtoLoop } from "./logic";
import { listOperations } from "./logic/listOperations";
import { IconOperation, IconResources } from "./types";

const toLiveOperation =
  (accountId: string) =>
  (operation: Operation): IconOperation => {
    const type = operation.type === "OUT" ? "OUT" : "IN";
    const fee = new BigNumber(operation.tx.fees.toString());
    const amount = new BigNumber(operation.value.toString());
    const value = type === "OUT" && operation.details?.hasValue ? amount.plus(fee) : amount;

    return {
      id: encodeOperationId(accountId, operation.tx.hash, type),
      accountId,
      fee,
      value,
      type,
      hash: operation.tx.hash,
      blockHash: null,
      blockHeight: operation.tx.block.height,
      date: operation.tx.date,
      senders: operation.senders,
      recipients: operation.recipients,
      extra: {},
      hasFailed: operation.tx.failed,
    };
  };

const fetchOperations = async (
  currency: CryptoCurrency,
  address: string,
  maxLength: number,
): Promise<Operation[]> => {
  const operations: Operation[] = [];
  let cursor: string | undefined;
  do {
    const page = await listOperations(currency, address, { minHeight: 0, cursor });
    operations.push(...page.items);
    if (page.items.length >= maxLength) {
      break;
    }
    cursor = page.next;
  } while (cursor);
  return operations;
};

export const getAccountShape: GetAccountShape = async (info: AccountShapeInfo) => {
  const { address, initialAccount, currency, derivationMode } = info;
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  try {
    const oldOperations = initialAccount?.operations || [];
    const blockHeight = await getCurrentBlockHeight(currency);
    const iconAccount = await getAccount(info.address, currency);

    const coreOperations = await fetchOperations(
      currency,
      address,
      iconAccount?.contract_updated_block - oldOperations.length,
    );
    const newOperations = coreOperations.map(toLiveOperation(accountId));
    const operations = mergeOps(oldOperations, newOperations);
    const delegationData = await getDelegation(address, currency);
    const iconResources: IconResources = {
      nonce: 0,
      totalDelegated: delegationData.totalDelegated,
      votingPower: delegationData.votingPower,
    };

    const balance = convertICXtoLoop(iconAccount?.balance || 0);
    const spendableBalance = balance
      .minus(iconResources.totalDelegated)
      .minus(iconResources.votingPower);

    return {
      id: accountId,
      balance,
      spendableBalance,
      operationsCount: operations.length,
      blockHeight,
      iconResources,
      operations,
    };
  } catch {
    return {
      id: accountId,
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
      operationsCount: 0,
      iconResources: {
        nonce: 0,
        totalDelegated: new BigNumber(0),
        votingPower: new BigNumber(0),
      },
      blockHeight: 0,
      operations: [],
    };
  }
};
