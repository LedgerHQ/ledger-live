import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "./types";
import type { DeviceTransactionField } from "../../transaction";
import { getMainAccount } from "../../account";

export type ExtraDeviceTransactionField =
  | {
      type: "icon.votes";
      label: string;
    }
  | {
      type: "icon.fees";
      label: string;
    };

function getDeviceTransactionConfig({
  transaction,
  account,
  parentAccount,
  status: { amount, estimatedFees },
}: {
  account: AccountLike;
  parentAccount?: Account;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];
  const mainAccount = getMainAccount(account, parentAccount);
  const { mode, votes } = transaction;
  if (votes && votes.length > 0) {
    // NB in future if we unify UI with other coin, we could converge to a "votes" top level
    fields.push({
      type: "icon.votes",
      label: "Votes",
    });
  }

  if (!estimatedFees.isZero()) {
    fields.push({
      type: "icon.fees",
      label: "Fees",
    });
  }

  if (!amount.isZero()) {
    fields.push({
      type: "amount",
      label: "Amount",
    });
  }

  switch (mode) {
    case 'freeze':
      fields.push({
        type: "address",
        label: "Freeze to",
        address: transaction.recipient,
      });
      break;

    case 'unfreeze':
      fields.push({
        type: "address",
        label: "Unfreeze From",
        address: transaction.recipient,
      });
      break;
    default:
      break;
  }

  if (mode !== "send") {
    fields.push({
      type: "address",
      label: "From Address",
      address: mainAccount.freshAddress,
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
