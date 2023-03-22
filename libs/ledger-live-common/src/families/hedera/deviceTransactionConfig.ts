import { capitalize } from "./utils";
import { STAKE_TYPE } from "./types";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "./types";
import type { DeviceTransactionField } from "../../transaction";

function getDeviceTransactionConfig({
  transaction,
  status: { estimatedFees },
}: {
  account: AccountLike;
  parentAccount?: Account;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];

  switch (transaction.mode) {
    case "stake":
      if (transaction.staked?.stakeType != null) {
        fields.push({
          type: "text",
          label: "Method",
          value: `${capitalize(transaction.staked?.stakeType)} Stake`,
        });
      }

      if (
        (transaction.staked?.stakeType === STAKE_TYPE.NEW ||
          transaction.staked?.stakeType === STAKE_TYPE.CHANGE) &&
        transaction.staked?.stakeMethod != null
      ) {
        fields.push(
          {
            type: "text",
            label: "Stake To",
            value: `${capitalize(transaction.staked?.stakeMethod)} ${
              transaction.staked?.accountId ?? transaction.staked?.nodeId
            }`,
          },
          {
            type: "text",
            label: "Receive Rewards?",
            value: transaction.staked?.declineRewards ? "No" : "Yes",
          }
        );
      }
      break;
      
    // default is `TransferTransaction` (Send)
    default:
      if (transaction.useAllAmount) {
        fields.push({
          type: "text",
          label: "Method",
          value: "Transfer All",
        });
      } else {
        fields.push({
          type: "text",
          label: "Method",
          value: "Transfer",
        });
      }
    
      fields.push({
        type: "amount",
        label: "Amount",
      });
      break;
    }

  if (!estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fees",
    });
  }

  if (transaction.memo) {
    fields.push({
      type: "text",
      label: "Memo",
      value: transaction.memo,
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
