import "./live-common-setup";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import StepReceiveFundsPostAlert from "./StepReceiveFundsPostAlert";
import StepReceiveFundsDeviceAnimation from "./ZcashReceiveDeviceAnimation";
import SendStepRecipientFromSelector from "./ZcashTransferFromSelector";
import SendStepAboveRecipientInput from "./ZcashSelfTransferToggle";
import SendModalTitle from "./SendModalTitle";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import operationDetails from "./operationDetails";
import AccountBodyHeader from "./AccountBodyHeader";
import { BitcoinFamily } from "./types";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import type { ZcashPrivateInfo } from "@ledgerhq/coin-zcash/network/types";

const family: BitcoinFamily = {
  sendAmountFields,
  sendRecipientFields,
  StepReceiveFundsPostAlert,
  StepReceiveFundsDeviceAnimation,
  // A Zcash account with a shielded address confirms its transparent and shielded
  // addresses with a single device exchange, so the shared receive step must not
  // also run the standard transparent-only confirmation. Anything else — no
  // shielded address yet, or the feature turned off — keeps the standard path.
  useCustomConfirmAddress: (account, featureFlags) => {
    if (!featureFlags.zcashShielded?.enabled || account.currency.id !== "zcash") return false;
    const privateInfo = (account as ZcashAccount).privateInfo as ZcashPrivateInfo | undefined;
    return !!privateInfo?.shieldedAddress;
  },
  SendStepRecipientFromSelector,
  SendStepAboveRecipientInput,
  SendModalTitle,
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
  modalsToPreload: ["MODAL_ZCASH_EXPORT_KEY", "MODAL_BITCOIN_EDIT_TRANSACTION"],
};

export default family;
