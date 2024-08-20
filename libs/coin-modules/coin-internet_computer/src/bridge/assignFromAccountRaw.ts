import { AccountBridge } from "@ledgerhq/types-live";
import {
  ICPAccount,
  ICPAccountRaw,
  InternetComputerOperation,
  Transaction,
  TransactionStatus,
} from "../types";
import { NeuronsData } from "@zondax/ledger-live-icp/neurons";
import { log } from "@ledgerhq/logs";

export const assignFromAccountRaw: AccountBridge<
  Transaction,
  ICPAccount,
  TransactionStatus,
  InternetComputerOperation,
  ICPAccountRaw
>["assignFromAccountRaw"] = (accountRaw, account) => {
  log("debug", `[ICP](assignFromAccountRaw) deserializing neurons`);
  if (!accountRaw.neuronsData) {
    return;
  }

  const { fullNeurons, neuronInfos, lastUpdated } = accountRaw.neuronsData;
  account.neurons = NeuronsData.deserialize(fullNeurons, neuronInfos, lastUpdated);
};
