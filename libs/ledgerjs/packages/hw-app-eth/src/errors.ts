import { createCustomErrorClass } from "@ledgerhq/errors";

export const EthAppPleaseEnableContractData = createCustomErrorClass(
  "EthAppPleaseEnableContractData",
);
export const EthAppNftNotSupported = createCustomErrorClass("EthAppNftNotSupported");
export const EthAppOperationDenied = createCustomErrorClass("TransactionRefusedOnDevice");
