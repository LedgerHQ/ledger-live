import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { CommonDeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import { Account, AccountLike } from "@ledgerhq/types-live";

import { methodToString } from "../common-logic/utils";
import { TRANSFER_TYPES, Transaction, TransactionStatus } from "../types";

async function getDeviceTransactionConfig({
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<CommonDeviceTransactionField>> {
  const currency = getCryptoCurrencyById("internet_computer");
  const fields: Array<CommonDeviceTransactionField> = [];

  const icp = (value: typeof transaction.amount) =>
    formatCurrencyUnit(currency.units[0], value, { showCode: false, disableRounding: true });
  const push = (label: string, value: string | undefined) => {
    if (value !== undefined && value !== "") fields.push({ type: "text", label, value });
  };

  push("Transaction Type", methodToString(transaction.type));

  if (TRANSFER_TYPES.has(transaction.type)) {
    push("Payment (ICP)", icp(transaction.amount));
    push("Maximum fee (ICP)", icp(transaction.fees));
    push("Memo", transaction.memo ?? "0");
    return fields;
  }

  // Governance ops: surface every signed, effect-defining parameter so the user can verify it.
  push("Neuron ID", transaction.neuronId);
  switch (transaction.type) {
    case "set_dissolve_delay":
      push("Dissolve Delay (s)", transaction.dissolveDelay);
      break;
    case "increase_dissolve_delay":
      push("Additional Dissolve Delay (s)", transaction.additionalDissolveDelay);
      break;
    case "add_hot_key":
      push("Hot Key", transaction.hotKeyToAdd);
      break;
    case "remove_hot_key":
      push("Hot Key", transaction.hotKeyToRemove);
      break;
    case "follow":
      push("Topic", transaction.followTopic);
      push("Followees", transaction.followeesIds?.join(", "));
      break;
    case "split_neuron":
      push("Split Amount (ICP)", icp(transaction.amount));
      break;
    case "spawn_neuron":
    case "spawn_neuron_from_maturity":
      push("Percentage to Spawn", transaction.percentageToSpawn);
      break;
    case "stake_maturity":
      push("Percentage to Stake", transaction.percentageToStake);
      break;
    case "auto_stake_maturity":
      push("Auto Stake Maturity", String(Boolean(transaction.autoStakeMaturity)));
      break;
  }

  return fields;
}

export default getDeviceTransactionConfig;
