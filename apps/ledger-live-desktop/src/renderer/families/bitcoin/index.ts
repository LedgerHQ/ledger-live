import "./live-common-setup";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import StepReceiveFundsPostAlert from "./StepReceiveFundsPostAlert";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import operationDetails from "./operationDetails";
import AccountBodyHeader from "./AccountBodyHeader";
import { BitcoinFamily } from "./types";

const family: BitcoinFamily = {
  sendAmountFields,
  sendRecipientFields,
  StepReceiveFundsPostAlert,
  accountHeaderManageActions,
  AccountBalanceSummaryFooter,
  operationDetails,
  AccountBodyHeader,
  handlesEditTransaction: ({ account, parentAccount, mainAccount, operation, featureFlags }) => {
    const isPending = !operation.blockHeight;
    const isCurrencySupported =
      featureFlags.bitcoin.supportedCurrencyIds?.includes(mainAccount.currency.id) || false;

    if (!featureFlags.bitcoin.enabled || !isCurrencySupported || !isPending) {
      return null;
    }

    // replaceTxId must always target the operation being replaced.
    const transactionRaw =
      operation.transactionRaw === undefined
        ? {
            family: "bitcoin" as const,
            amount: "0",
            recipient: mainAccount.freshAddress,
            rbf: true,
            replaceTxId: operation.hash,
            utxoStrategy: { strategy: 0, excludeUTXOs: [] },
            feePerByte: null,
            networkInfo: null,
          }
        : { ...operation.transactionRaw, replaceTxId: operation.hash };

    return {
      modalName: "MODAL_BITCOIN_EDIT_TRANSACTION",
      params: {
        account,
        parentAccount,
        transactionRaw,
        transactionHash: operation.hash,
      },
    };
  },
};

export default family;
