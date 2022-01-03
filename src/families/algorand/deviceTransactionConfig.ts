import type {
  AccountLike,
  TransactionStatus,
  TokenCurrency,
} from "../../types";
import type { AlgorandTransaction } from "./types";
import type { DeviceTransactionField } from "../../transaction";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit, findTokenById } from "../../currencies";
import { extractTokenId } from "./tokens";
export const displayTokenValue = (token: TokenCurrency) =>
  `${token.name} (#${extractTokenId(token.id)})`;

const getSendFields = (transaction, status, account, addRecipient: boolean) => {
  const { estimatedFees, amount } = status;
  const fields: {
    type: string;
    label: string;
    value?: string;
    address?: string;
  }[] = [];
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
      value: displayTokenValue(account.token),
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
  account: AccountLike;
  transaction: AlgorandTransaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const { mode, assetId } = transaction;
  const { estimatedFees } = status;
  let fields: {
    type: string;
    label: string;
    value?: string;
    address?: string;
  }[] = [];

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

      if (assetId) {
        const token = findTokenById(assetId);
        fields.push({
          type: "text",
          label: "Asset ID",
          value: token
            ? displayTokenValue(token)
            : `#${extractTokenId(assetId)}`,
        });
      }

      fields.push({
        type: "text",
        label: "Asset amt",
        value: "0",
      });
      break;

    default:
      break;
  }

  return fields as Array<DeviceTransactionField>;
}

export default getDeviceTransactionConfig;
