import { getMainAccount } from "@ledgerhq/coin-framework/account";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import type { CommonDeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { PolkadotAccount, Transaction, TransactionStatus } from "../types";
import { isStash } from "./utils";
const currency = getCryptoCurrencyById("polkadot");
export type ExtraDeviceTransactionField = {
  type: "polkadot.validators";
  label: string;
};
type DeviceTransactionField = CommonDeviceTransactionField | ExtraDeviceTransactionField;

const getSendFields = ({
  transaction,
  status: { amount },
}: {
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> => {
  const fields: Array<DeviceTransactionField> = [];
  fields.push({
    type: "text",
    label: "Balances",
    value: transaction?.useAllAmount ? "Transfer" : "Transfer keep alive",
  });
  fields.push({
    type: "amount",
    label: "Amount",
    value: formatCurrencyUnit(currency.units[0], amount, {
      showCode: true,
      disableRounding: true,
    }),
  });
  return fields;
};

async function getDeviceTransactionConfig({
  account,
  parentAccount,
  transaction,
  status,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField>> {
  const { mode, rewardDestination } = transaction;
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
