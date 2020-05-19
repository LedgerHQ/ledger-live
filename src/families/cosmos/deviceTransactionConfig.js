// @flow

import type { AccountLike, Account, TransactionStatus } from "../../types";
import type { Transaction } from "./types";
import type { DeviceTransactionField } from "../../transaction";
import { getMainAccount } from "../../account";

export type ExtraDeviceTransactionField =
  | { type: "cosmos.delegateValidators", label: string }
  | { type: "cosmos.validatorName", label: string }
  | { type: "cosmos.validatorAmount", label: string }
  | { type: "cosmos.sourceValidatorName", label: string };

function getDeviceTransactionConfig({
  account,
  parentAccount,
  transaction,
  status,
}: {
  account: AccountLike,
  parentAccount: ?Account,
  transaction: Transaction,
  status: TransactionStatus,
}): Array<DeviceTransactionField> {
  const { amount, mode } = transaction;
  const { estimatedFees } = status;
  const mainAccount = getMainAccount(account, parentAccount);
  const source = mainAccount.freshAddress;

  const fields = [
    {
      type: "address",
      label: "Source",
      address: source,
    },
  ];

  switch (mode) {
    case "delegate":
      fields.push({
        type: "cosmos.delegateValidators",
        label: "Validators",
      });
      break;
    case "undelegate":
      fields.push({
        type: "cosmos.validatorName",
        label: "Validator",
      });
      fields.push({
        type: "cosmos.validatorAmount",
        label: "Undelegated amount",
      });
      break;
    case "redelegate":
      fields.push({
        type: "cosmos.sourceValidatorName",
        label: "From",
      });
      fields.push({
        type: "cosmos.validatorName",
        label: "To",
      });
      fields.push({
        type: "cosmos.validatorAmount",
        label: "Redelegated amount",
      });
      break;
    case "claimRewardCompound":
    case "claimReward":
      fields.push({
        type: "cosmos.validatorName",
        label: "Validator",
      });
      fields.push({
        type: "cosmos.validatorAmount",
        label: "Reward amount",
      });
      break;
    default:
      break;
  }

  if (amount && !amount.isZero()) {
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
