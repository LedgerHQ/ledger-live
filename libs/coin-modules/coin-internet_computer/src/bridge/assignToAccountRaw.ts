import { AccountBridge } from "@ledgerhq/types-live";
import {
  ICPAccount,
  ICPAccountRaw,
  InternetComputerOperation,
  Transaction,
  TransactionStatus,
} from "../types";
import { log } from "@ledgerhq/logs";

export const assignToAccountRaw: AccountBridge<
  Transaction,
  ICPAccount,
  TransactionStatus,
  InternetComputerOperation,
  ICPAccountRaw
>["assignToAccountRaw"] = (account, accountRaw) => {
  log("debug", `[ICP](assignToAccountRaw) serializing neurons`);
  const { fullNeurons, neuronInfos } = account.neurons.serialize();
  accountRaw.neuronsData = {
    fullNeurons,
    neuronInfos,
    lastUpdated: account.neurons.lastUpdatedMSecs,
  };
};
