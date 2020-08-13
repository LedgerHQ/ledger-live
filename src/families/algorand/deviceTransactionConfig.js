// @flow

import type { AccountLike, TransactionStatus } from "../../types";
import type { Transaction } from "./types";
import type { DeviceTransactionField } from "../../transaction";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { extractTokenId } from "./tokens";

const getSendFields = (transaction, status, account, addRecipient: boolean) => {
  const { amount } = transaction;
  const { estimatedFees } = status;
  const fields = [];

  fields.push({
    type: "text",
    label: "Type",
    value: account.type === "TokenAccount" ? "Asset xfer" : "Payment",
  });

  if (estimatedFees && !estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fee",
    });
  }

  if (addRecipient) {
    fields.push({
      type: "address",
      label: "Recipient",
      address: transaction.recipient,
    });
  }

  if (account.type === "TokenAccount") {
    fields.push({
      type: "text",
      label: "Asset ID",
      value: extractTokenId(account.token.id),
    });
  }

  if (amount) {
    fields.push({
      type: "text",
      label: account.type === "TokenAccount" ? "Asset amt" : "Amount",
      value: formatCurrencyUnit(getAccountUnit(account), amount, {
        showCode: true,
        disableRounding: true,
      }),
    });
  }

  return fields;
};

function getDeviceTransactionConfig({
  account,
  transaction,
  status,
}: {
  account: AccountLike,
  transaction: Transaction,
  status: TransactionStatus,
}): Array<DeviceTransactionField> {
  const { mode, assetId } = transaction;
  const { estimatedFees } = status;

  let fields = [];

  switch (mode) {
    case "send":
      fields = getSendFields(transaction, status, account, false);
      break;
    case "claimReward":
      fields = getSendFields(transaction, status, account, true);
      break;

    case "optIn":
      fields.push({
        type: "text",
        label: "Type",
        value: "Asset xfer",
      });

      if (estimatedFees && !estimatedFees.isZero()) {
        fields.push({
          type: "fees",
          label: "Fee",
        });
      }

      fields.push({
        type: "text",
        label: "Asset id",
        value: assetId ? extractTokenId(assetId) : "",
      });

      fields.push({
        type: "text",
        label: "Asset amt",
        value: "0",
      });
      break;

    case "optOut":
      fields.push({
        type: "text",
        label: "Type",
        value: "Opt out",
      });
      if (assetId)
        fields.push({
          type: "text",
          label: "Asset id",
          value: assetId,
        });
      break;

    default:
      break;
  }

  return fields;
}

export default getDeviceTransactionConfig;
