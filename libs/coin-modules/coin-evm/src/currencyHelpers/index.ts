import { OperationType } from "@ledgerhq/types-live";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { EtherscanOperation, LedgerExplorerOperation } from "../types";
import { getCeloOperationType } from "./celo";

export const getCurrencySpecificOutOperationType = (
  currencyId: CryptoCurrencyId,
  rawOperation: EtherscanOperation | LedgerExplorerOperation,
): OperationType | undefined => {
  switch (currencyId) {
    case "celo_evm":
      return getCeloOperationType(rawOperation);
    default:
      return;
  }
};
