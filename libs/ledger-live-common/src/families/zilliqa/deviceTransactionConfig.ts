import { getMainAccount } from "../../account";
import type { DeviceTransactionField } from "../../transaction";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { TransactionStatus } from "./types";

function getDeviceTransactionConfig({
  account,
  parentAccount,
  status: { amount, estimatedFees },
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];
  const mainAccount = getMainAccount(account, parentAccount);
  const source = mainAccount.freshAddress;

  fields.push({
    type: "text",
    label: "Type",
    value: "Send",
  });

  fields.push({
    type: "address",
    label: "From",
    address: source,
  });

  if (!amount.isZero()) {
    fields.push({
      type: "amount",
      label: "Amount",
    });
  }

  if (estimatedFees && !estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fees",
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
