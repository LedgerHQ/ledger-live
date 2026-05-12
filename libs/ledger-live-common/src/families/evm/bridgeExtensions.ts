import {
  isEditableOperation,
  isStuckOperation,
  getStuckAccountAndOperation,
} from "@ledgerhq/coin-evm/operation";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountBridgeExtensions, AccountLike } from "@ledgerhq/types-live";
import { getCurrencyConfiguration } from "../../config";

function hasGasTracker(currency: CryptoCurrency): boolean {
  const config = getCurrencyConfiguration<EvmConfigInfo>(currency.id);
  return !!config.gasTracker;
}

const extensions: AccountBridgeExtensions = {
  isEditableOperation: (account: Account, operation) =>
    isEditableOperation(account, operation, hasGasTracker),
  isStuckOperation,
  getStuckAccountAndOperation: (account: AccountLike, parentAccount) =>
    getStuckAccountAndOperation(account, parentAccount, hasGasTracker),
};

export default extensions;
