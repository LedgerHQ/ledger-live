// @flow

import type { AccountLike, Account, TransactionStatus } from "../../types";
import type { Transaction } from "./types";
import type { DeviceTransactionField } from "../../transaction";
import { getMainAccount } from "../../account";
import { formatCurrencyUnit, getCryptoCurrencyById } from "../../currencies";
import { isStash } from "./logic";

const currency = getCryptoCurrencyById("polkadot");

export type ExtraDeviceTransactionField = {
  type: "polkadot.validators",
  label: string,
};

const getSendFields = ({
  status: { amount },
}: {
  transaction: Transaction,
  status: TransactionStatus,
}) => {
  const fields = [];

  fields.push({
    type: "text",
    label: "Balances",
    value: "Transfer keep alive",
  });

  fields.push({
    type: "text",
    label: "Value",
    value: formatCurrencyUnit(currency.units[0], amount, {
      showCode: true,
      disableRounding: true,
    }),
  });

  return fields;
};

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
  const { mode, recipient, rewardDestination } = transaction;
  const { amount } = status;
  const mainAccount = getMainAccount(account, parentAccount);

  let fields = [];

  switch (mode) {
    case "send":
      fields = getSendFields({
        transaction,
        status,
      });
      break;

    case "nominate":
      fields.push({
        type: "text",
        label: "Staking",
        value: "Nominate",
      });

      fields.push({
        type: "polkadot.validators",
        label: "Targets",
      });
      break;

    case "bond":
      if (!isStash(mainAccount)) {
        fields.push({
          type: "text",
          label: "Staking",
          value: "Bond",
        });

        fields.push({
          type: "text",
          label: "Controller",
          value: recipient,
        });

        fields.push({
          type: "text",
          label: "Value",
          value: formatCurrencyUnit(currency.units[0], amount, {
            showCode: true,
            disableRounding: true,
          }),
        });

        fields.push({
          type: "text",
          label: "Payee",
          value: rewardDestination || "Stash",
        });
      } else {
        fields.push({
          type: "text",
          label: "Staking",
          value: "Bond extra",
        });

        fields.push({
          type: "text",
          label: "Max additional",
          value: formatCurrencyUnit(currency.units[0], amount, {
            showCode: true,
            disableRounding: true,
          }),
        });
      }

      break;

    case "rebond":
      fields.push({
        type: "text",
        label: "Staking",
        value: "Rebond",
      });

      fields.push({
        type: "text",
        label: "Value",
        value: formatCurrencyUnit(currency.units[0], amount, {
          showCode: true,
          disableRounding: true,
        }),
      });
      break;

    case "unbond":
      fields.push({
        type: "text",
        label: "Staking",
        value: "Unbond",
      });

      fields.push({
        type: "text",
        label: "Value",
        value: formatCurrencyUnit(currency.units[0], amount, {
          showCode: true,
          disableRounding: true,
        }),
      });
      break;

    case "chill":
      fields.push({
        type: "text",
        label: "Staking",
        value: "Chill",
      });
      break;

    case "withdrawUnbonded":
      fields.push({
        type: "text",
        label: "Staking",
        value: "Withdraw Unbonded",
      });
      break;

    case "claimReward":
      fields.push({
        type: "text",
        label: "Staking",
        value: "Payout Stakers",
      });
      break;

    default:
      break;
  }

  fields.push({
    type: "fees",
    label: "Fees",
  });

  return fields;
}

export default getDeviceTransactionConfig;
