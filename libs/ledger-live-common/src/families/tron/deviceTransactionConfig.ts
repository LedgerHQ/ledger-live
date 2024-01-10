import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "./types";
import { getMainAccount } from "../../account";
import type { DeviceTransactionField } from "../../transaction";

export type ExtraDeviceTransactionField =
  | {
      type: "tron.resource";
      label: string;
      value: string;
    }
  | {
      type: "tron.votes";
      label: string;
    };

function getDeviceTransactionConfig({
  transaction: { votes, resource, mode, recipient },
  account,
  parentAccount,
  status: { amount },
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const mainAccount = getMainAccount(account, parentAccount);
  const fields: Array<DeviceTransactionField> = [];

  if (resource) {
    fields.push({
      type: "tron.resource",
      label: "Resource",
      value: resource.slice(0, 1).toUpperCase() + resource.slice(1).toLowerCase(),
    });
  }

  if (votes && votes.length > 0) {
    // NB in future if we unify UI with other coin, we could converge to a "votes" top level
    fields.push({
      type: "tron.votes",
      label: "Votes",
    });
  }

  if (!amount.isZero()) {
    fields.push({
      type: "amount",
      label: "Amount",
    });
  }

  if (mode === "freeze") {
    fields.push({
      type: "address",
      label: "Freeze To",
      address: mainAccount.freshAddress,
    });
  }

  if (mode === "unfreeze" || mode === "legacyUnfreeze") {
    fields.push({
      type: "address",
      label: "Unfreeze To",
      address: mainAccount.freshAddress,
    });
  }

  if (mode === "withdrawExpireUnfreeze") {
    fields.push({
      type: "address",
      label: "Withdraw unfrozen to",
      address: mainAccount.freshAddress,
    });
  }

  if (mode === "unDelegateResource") {
    fields.push({
      type: "address",
      label: "Undelegate from",
      address: recipient,
    });
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
