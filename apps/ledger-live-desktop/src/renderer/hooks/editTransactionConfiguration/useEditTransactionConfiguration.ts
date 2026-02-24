import { Account, Operation } from "@ledgerhq/types-live";
import * as bitcoin from "./families/bitcoinEditTransactionConfiguration";

type Configuration = {
  modalName: "MODAL_BITCOIN_EDIT_TRANSACTION" | "MODAL_EVM_EDIT_TRANSACTION";
  isSupported: boolean;
};

type HandlerFunction = (mainAccount: Account, operation: Operation) => null | Configuration;

const handlers = new Map<string, HandlerFunction>();
handlers.set(bitcoin.getSupportedFamily(), bitcoin.useGetConfiguration);

export function useEditTransactionConfiguration(
  family: string,
  mainAccount: Account,
  operation: Operation,
) {
  const getConfigurationStartegy = handlers.get(family);
  if (getConfigurationStartegy) {
    return getConfigurationStartegy(mainAccount, operation);
  }

  return null;
}
