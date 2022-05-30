import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { Transaction } from "./types";
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
  source,
}: {
  totalSpent: BigNumber;
  source: string;
}) => {
  const currency = getCryptoCurrencyById("osmo");
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
      value: formatCurrencyUnit(currency.units[0], totalSpent, {
        //TODO improve this by using formatCurrencyUnit like Cosmos does. Meaning: dynamically pick uosmo or OSMO
        showCode: true,
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
  const { mode, memo } = transaction;

  let fields: Array<OsmosisTransactionFieldType> = [];
  const mainAccount = getMainAccount(account, parentAccount);
  const source = mainAccount.freshAddress;

  switch (mode) {
    case "send":
      fields = getSendFields({
        totalSpent,
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
