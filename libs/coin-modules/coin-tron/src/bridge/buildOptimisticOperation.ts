import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import get from "lodash/get";
import { getOperationTypefromMode } from "../logic/utils";
import {
  Transaction,
  TronAccount,
  TronOperation,
  TronResource,
  TrongridExtraTxInfo,
} from "../types";

const getValue = (
  account: TronAccount,
  subAccount: TokenAccount | undefined,
  transaction: Transaction,
  fee: BigNumber,
): BigNumber => {
  switch (transaction.mode) {
    case "send":
      return subAccount ? fee : new BigNumber(transaction.amount || 0).plus(fee);

    case "claimReward": {
      return account.tronResources ? account.tronResources.unwithdrawnReward : new BigNumber(0);
    }

    default:
      return new BigNumber(0);
  }
};

const getExtra = (
  account: TronAccount,
  transaction: Transaction,
  resource: TronResource,
): TrongridExtraTxInfo | null | undefined => {
  switch (transaction.mode) {
    case "freeze":
      return {
        frozenAmount: transaction.amount,
      };

    case "unfreeze":
      return {
        unfreezeAmount: transaction.amount,
      };

    case "vote":
      return {
        votes: transaction.votes,
      };

    case "unDelegateResource":
      return {
        unDelegatedAmount: transaction.amount,
        receiverAddress: transaction.recipient,
      };

    case "legacyUnfreeze":
      return {
        unfreezeAmount: get(
          account.tronResources,
          `frozen.${resource.toLocaleLowerCase()}.amount`,
          new BigNumber(0),
        ),
      };

    default:
      return undefined;
  }
};

export const buildOptimisticOperation = (
  account: TronAccount,
  subAccount: TokenAccount | undefined,
  transaction: Transaction,
  fee: BigNumber,
  hash: string,
): TronOperation => {
  const value = getValue(account, subAccount, transaction, fee);
  const operationType = getOperationTypefromMode(transaction.mode);
  const resource = transaction.resource || "BANDWIDTH";
  const extra = getExtra(account, transaction, resource) || {};

  /**
   * FIXME
   *
   * This is not working and cannot work simply because this "NONE" type doesn't exist during a sync,
   * as well as subOperations which are never created either.
   *
   * And even after fixing this,  we're getting wrong fee estimation for TRC20 transactions
   * which are considered as 0 all the time, while it always being between 1 and 10 TRX.
   */
  const operation: TronOperation = {
    id: encodeOperationId(account.id, hash, operationType),
    hash,
    // if it's a token op and there is no fee, this operation does not exist and is a "NONE"
    type: subAccount && value.eq(0) ? "NONE" : operationType,
    value,
    fee,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [transaction.recipient],
    accountId: account.id,
    date: new Date(),
    extra,
    subOperations: subAccount
      ? [
          {
            id: encodeOperationId(subAccount.id, hash, "OUT"),
            hash,
            type: "OUT",
            value:
              transaction.useAllAmount && subAccount
                ? subAccount.balance
                : new BigNumber(transaction.amount || 0),
            fee: new BigNumber(0),
            blockHash: null,
            blockHeight: null,
            senders: [account.freshAddress],
            recipients: [transaction.recipient],
            accountId: subAccount.id,
            date: new Date(),
            extra: {},
          },
        ]
      : [],
  };

  return operation;
};
