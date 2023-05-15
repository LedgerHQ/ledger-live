import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { validateDomain } from "@ledgerhq/domain-service/utils/index";
import { Account, AccountLike } from "@ledgerhq/types-live";

import type { CommonDeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import { Transaction as EvmTransaction, TransactionStatus } from "./types";

type DeviceTransactionField = CommonDeviceTransactionField;

/**
 * Method responsible for creating the summary of the screens visible on the nano
 */
function getDeviceTransactionConfig({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: EvmTransaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const mainAccount = getMainAccount(account, parentAccount);
  const { mode } = transaction;
  const fields: Array<DeviceTransactionField> = [];
  const hasValidDomain = validateDomain(transaction.recipientDomain?.domain);

  switch (mode) {
    default:
    case "send":
      fields.push(
        {
          type: "amount",
          label: "Amount",
        },
        transaction.recipientDomain && hasValidDomain
          ? {
              type: "text",
              label: "Domain",
              value: transaction.recipientDomain.domain,
            }
          : {
              type: "address",
              label: "Address",
              address: transaction.recipient,
            },
        {
          type: "text",
          label: "Network",
          value: mainAccount.currency.name,
        }
      );
      break;
  }

  fields.push({
    type: "fees",
    label: "Max fees",
  });

  return fields;
}

export default getDeviceTransactionConfig;
