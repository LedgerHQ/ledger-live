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
import PostBroadcastEffect from "./ZcashPostBroadcastSync";
import { ZcashAmountStepSync } from "./ZcashAmountStepSync";
import { ZcashSyncNotice } from "./ZcashSyncNotice";
import { getAccountRecipientAddresses } from "./getAccountRecipientAddresses";
import { BitcoinFamily } from "./types";
import type { ZcashAccount } from "@ledgerhq/coin-zcash/types";
import { getEditableTransactionRaw } from "@ledgerhq/live-common/families/bitcoin/editTransaction/editableTransaction";
import type { ZcashPrivateInfo } from "@ledgerhq/coin-zcash/network/types";
import { isZcashCurrencyId } from "@ledgerhq/live-common/bridge/zcashRouting";

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
    if (!featureFlags.zcashShielded?.enabled || !isZcashCurrencyId(account.currency.id))
      return false;
    const privateInfo = (account as ZcashAccount).privateInfo as ZcashPrivateInfo | undefined;
    return !!privateInfo?.shieldedAddress;
  },
  SendStepRecipientFromSelector,
  SendStepAboveRecipientInput,
  SendModalTitle,
  SendRecipientNotice: ZcashSyncNotice,
  getAccountRecipientAddresses,
  accountHeaderManageActions,
  AccountBalanceSummaryFooter,
  operationDetails,
  AccountBodyHeader,
  PostBroadcastEffect,
  SendAmountEffect: ZcashAmountStepSync,
  handlesEditTransaction: ({ account, parentAccount, mainAccount, operation, featureFlags }) => {
    const isPending = !operation.blockHeight;
    const isCurrencySupported =
      featureFlags.bitcoin.supportedCurrencyIds?.includes(mainAccount.currency.id) || false;

    if (!featureFlags.bitcoin.enabled || !isCurrencySupported || !isPending) {
      return null;
    }

    return {
      modalName: "MODAL_BITCOIN_EDIT_TRANSACTION",
      params: {
        account,
        parentAccount,
        transactionRaw: getEditableTransactionRaw(operation, mainAccount),
        transactionHash: operation.hash,
      },
    };
  },
  modalsToPreload: ["MODAL_ZCASH_EXPORT_KEY", "MODAL_BITCOIN_EDIT_TRANSACTION"],
};

export default family;
