import { getMessageProperties } from "@ledgerhq/coin-evm/logic";
import { isEditableOperation } from "@ledgerhq/coin-evm/operation";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountFooter from "./AccountFooter";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import sendAmountFields from "./SendAmountFields";
import StepSummaryNetworkFeesRow from "./StepSummaryNetworkFeesRow";
import transactionConfirmFields from "./TransactionConfirmFields";
import { EvmFamily } from "./types";

const family: EvmFamily = {
  operationDetails: {
    OperationDetailsExtra: () => null,
  },
  AccountBalanceSummaryFooter,
  AccountBodyHeader,
  AccountFooter,
  accountHeaderManageActions,
  transactionConfirmFields,
  sendAmountFields,
  StepSummaryNetworkFeesRow,
  message: {
    getMessageProperties,
  },
  handlesEditTransaction: ({ account, parentAccount, mainAccount, operation, featureFlags }) => {
    if (!operation.transactionRaw) {
      return null;
    }

    const isCurrencySupported =
      featureFlags.evm.supportedCurrencyIds?.includes(mainAccount.currency.id) || false;
    const hasGasTracker = (currency: CryptoCurrency): boolean => {
      const config = getCurrencyConfiguration<EvmConfigInfo>(currency.id);
      return !!config.gasTracker;
    };
    const isEditable = isEditableOperation(mainAccount, operation, hasGasTracker);

    if (!featureFlags.evm.enabled || !isCurrencySupported || !isEditable) {
      return null;
    }

    return {
      modalName: "MODAL_EVM_EDIT_TRANSACTION",
      params: {
        account,
        parentAccount,
        transactionRaw: operation.transactionRaw,
        transactionHash: operation.hash,
      },
    };
  },
};

export default family;
