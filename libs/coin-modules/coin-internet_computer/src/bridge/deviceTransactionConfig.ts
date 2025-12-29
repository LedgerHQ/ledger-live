import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { log } from "@ledgerhq/logs";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import type { CommonDeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";

import { Transaction, TransactionStatus } from "../types";
import { methodToString } from "../common-logic/utils";
import { nowInSeconds } from "@zondax/ledger-live-icp/utils";
import { KNOWN_TOPICS } from "../consts";
import BigNumber from "bignumber.js";

const currency = getCryptoCurrencyById("internet_computer");

async function getDeviceTransactionConfig({
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<CommonDeviceTransactionField>> {
  const fields: Array<CommonDeviceTransactionField> = [];
  fields.push({
    type: "text",
    label: "Transaction Type",
    value: methodToString(transaction.type),
  });

  if (transaction.neuronId) {
    fields.push({
      type: "text",
      label: "Neuron Id",
      value: transaction.neuronId ?? "0",
    });

    if (transaction.followTopic !== undefined) {
      fields.push({
        type: "text",
        label: "Topic",
        value: KNOWN_TOPICS[transaction.followTopic],
      });
    }

    if (transaction.followeesIds) {
      fields.push({
        type: "text",
        label: "Followees",
        value: transaction.followeesIds.join(", "),
      });
    }

    switch (transaction.type) {
      case "stake_maturity":
        fields.push({
          type: "text",
          label: "Percentage to Stake",
          value: transaction.percentageToStake ?? "100",
        });
        break;
      case "remove_hot_key":
        fields.push({
          type: "text",
          label: "Principal",
          value: transaction.hotKeyToRemove ?? "",
        });
        break;
      case "add_hot_key":
        fields.push({
          type: "text",
          label: "Principal",
          value: transaction.hotKeyToAdd ?? "",
        });
        break;
      case "auto_stake_maturity":
        fields.push({
          type: "text",
          label: "Auto Stake",
          value: transaction.autoStakeMaturity ? "true" : "false",
        });
        break;
      case "spawn_neuron":
        fields.push({
          type: "text",
          label: "Controller",
          value: "self",
        });
        break;
      case "disburse":
        fields.push({
          type: "text",
          label: "Disburse To",
          value: "Self",
        });
        break;
      case "set_dissolve_delay": {
        const dissolveDelayStr = new Date(
          BigNumber(transaction.dissolveDelay ?? "0")
            .plus(nowInSeconds())
            .times(1000)
            .toNumber(),
        )
          .toISOString()
          .split("T")[0];

        fields.push({
          type: "text",
          label: "Dissolve Date",
          value: dissolveDelayStr,
        });
        break;
      }
    }
  }

  if (transaction.amount.gt(0)) {
    fields.push({
      type: "text",
      label: "Amount (ICP)",
      value: formatCurrencyUnit(currency.units[0], transaction.amount, {
        showCode: false,
        disableRounding: true,
      }),
    });
    fields.push({
      type: "text",
      label: "Maximum fee (ICP)",
      value: formatCurrencyUnit(currency.units[0], transaction.fees, {
        showCode: false,
        disableRounding: true,
      }),
    });
  }

  if (transaction.memo && transaction.memo !== "0") {
    fields.push({
      type: "text",
      label: "Memo",
      value: transaction.memo,
    });
  }
  log("debug", `Transaction config ${JSON.stringify(fields)}`);

  return fields;
}

export default getDeviceTransactionConfig;
