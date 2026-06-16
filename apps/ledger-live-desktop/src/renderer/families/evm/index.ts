import { getMessageProperties } from "@ledgerhq/coin-evm/logic";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountFooter from "./AccountFooter";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import sendAmountFields from "./SendAmountFields";
import StepSummaryNetworkFeesRow from "./StepSummaryNetworkFeesRow";
import transactionConfirmFields from "./TransactionConfirmFields";
import OperationDetailsExtra, { amountCellExtra, amountCell } from "./operationDetails";
import { EvmFamily } from "./types";

const family: EvmFamily = {
  operationDetails: {
    OperationDetailsExtra,
    amountCellExtra,
    amountCell,
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
  handlesEditTransaction: ({
    account,
    parentAccount,
    mainAccount,
    operation,
    bridge,
    featureFlags,
  }) => {
    if (!operation.transactionRaw) {
      return null;
    }

    const isCurrencySupported =
      featureFlags.evm.supportedCurrencyIds?.includes(mainAccount.currency.id) || false;
    const isEditable = bridge.isEditableOperation(mainAccount, operation);

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
  modalsToPreload: [
    "MODAL_EVM_STAKE",
    "MODAL_EVM_EDIT_TRANSACTION",
    "MODAL_EVM_DELEGATE",
    "MODAL_EVM_REWARDS_INFO",
    "MODAL_EVM_UNDELEGATE",
    "MODAL_EVM_REDELEGATE",
    "MODAL_EVM_WITHDRAW",
    "MODAL_EVM_CLAIM_REWARDS",
  ],
};

export default family;
