import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { PolkadotAccount, Transaction, TransactionStatus } from "./types";
import type { CommonDeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import {
  formatCurrencyUnit,
  getCryptoCurrencyById,
} from "@ledgerhq/coin-framework/currencies/index";
import { isStash } from "./logic";
const currency = getCryptoCurrencyById("polkadot");
export type ExtraDeviceTransactionField = {
  type: "polkadot.validators";
  label: string;
};
type DeviceTransactionField = CommonDeviceTransactionField &
  ExtraDeviceTransactionField;

const getSendFields = ({
  transaction,
  status: { amount },
}: {
  transaction: Transaction;
  status: TransactionStatus;
}) => {
  const fields: { type: string; label: string; value: string }[] = [];
  fields.push({
    type: "text",
    label: "Balances",
    value:
      transaction && transaction.useAllAmount
        ? "Transfer"
        : "Transfer keep alive",
  });
  fields.push({
    type: "text",
    label: "Amount",
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
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const { mode, recipient, rewardDestination } = transaction;
  const { amount } = status;
  const mainAccount = getMainAccount(account, parentAccount) as PolkadotAccount;
  let fields: { type: string; label: string; value?: string }[] = [];

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
          label: "Amount",
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
          label: "Amount",
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
        label: "Amount",
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
        label: "Amount",
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

    case "setController":
      fields.push({
        type: "text",
        label: "Staking",
        value: "Set controller",
      });
      fields.push({
        type: "text",
        label: "Controller",
        value:
          // NOTE: I added this here as TokenAccount and ChildAccount
          // both don't have freshAddress
          account.type === "Account"
            ? account.freshAddress
            : mainAccount.freshAddress,
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
  return fields as DeviceTransactionField[];
}

export default getDeviceTransactionConfig;
