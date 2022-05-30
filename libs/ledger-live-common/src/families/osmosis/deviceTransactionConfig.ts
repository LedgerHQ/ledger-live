import { Transaction } from "./types";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import type { DeviceTransactionField } from "../../transaction";
import type { Account, AccountLike, TransactionStatus } from "../../types";
import BigNumber from "bignumber.js";
import { getMainAccount } from "../../account";

type OsmosisTransactionFieldType = DeviceTransactionField & {
  type: string;
  label: string;
  value?: string;
  address?: string;
  memo?: string;
};

export type ExtraDeviceTransactionField =
  | {
      type: "osmosis.delegateValidators";
      label: string;
    }
  | {
      type: "osmosis.validatorName";
      label: string;
    }
  | {
      type: "osmosis.sourceValidatorName";
      label: string;
    };

const getSendFields = ({
  totalSpent,
  account,
  source,
}: {
  totalSpent: BigNumber;
  account: AccountLike;
  source: string;
}) => {
  const fields: OsmosisTransactionFieldType[] = [];

  fields.push({
    type: "text",
    label: "Type",
    value: "Send",
  });

  if (!totalSpent.isZero()) {
    fields.push({
      type: "text",
      label: "Amount",
      value: formatCurrencyUnit(getAccountUnit(account), totalSpent, {
        showCode: true,
        disableRounding: true,
      }),
    });
  }

  fields.push({
    type: "address",
    label: "From",
    address: source,
  });
  return fields;
};

function getDeviceTransactionConfig({
  account,
  parentAccount,
  transaction,
  status: { estimatedFees, totalSpent },
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const { mode, memo, validators } = transaction;

  let fields: Array<OsmosisTransactionFieldType> = [];
  const mainAccount = getMainAccount(account, parentAccount);
  const source = mainAccount.freshAddress;

  switch (mode) {
    case "send":
      fields = getSendFields({
        totalSpent,
        account,
        source,
      });
      break;

    case "delegate":
      fields.push({
        type: "text",
        label: "Type",
        value: "Delegate",
      });
      fields.push({
        type: "cosmos.delegateValidators",
        label: "Validators",
      });
      break;

    case "redelegate":
      fields.push({
        type: "text",
        label: "Type",
        value: "Redelegate",
      });
      fields.push({
        type: "text",
        label: "Amount",
        value: formatCurrencyUnit(
          getAccountUnit(account),
          validators[0].amount,
          {
            showCode: true,
            disableRounding: true,
          }
        ),
      });
      fields.push({
        type: "osmosis.validatorName",
        label: "Validator Dest",
      });
      fields.push({
        type: "osmosis.sourceValidatorName",
        label: "Validator Source",
      });
      break;

    default:
      break;
  }

  if (!estimatedFees.isNaN() && estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fee",
    });
  }

  if (memo) {
    fields.push({
      type: "text",
      label: "Memo",
      value: memo,
    });
  }

  // fields.push({
  //   type: "text",
  //   label: "Total",
  //   value: formatCurrencyUnit(currency.units[0], totalSpent, {
  //     showCode: true,
  //   }),
  // });

  return fields;
}

export default getDeviceTransactionConfig;
