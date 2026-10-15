// Zcash keeps wallet-btc's transparent account model, and with it the secp256k1 workers the
// bitcoin family sets up for address derivation.
import "../bitcoin/live-common-setup";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import StepReceiveFundsPostAlert from "./StepReceiveFundsPostAlert";
import StepReceiveFundsDeviceAnimation from "./ZcashReceiveDeviceAnimation";
import SendStepRecipientFromSelector from "./ZcashTransferFromSelector";
import SendStepAboveRecipientInput from "./ZcashSelfTransferToggle";
import SendModalTitle from "./SendModalTitle";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import operationDetails from "./operationDetails";
import PostBroadcastEffect from "./ZcashPostBroadcastSync";
import { ZcashAmountStepSync } from "./ZcashAmountStepSync";
import { ZcashSyncNotice } from "./ZcashSyncNotice";
import { getAccountRecipientAddresses } from "./getAccountRecipientAddresses";
import type { ZcashFamily } from "./types";

/**
 * The Zcash currencies' family. Zcash has no fee market, no RBF and no coin control, so it
 * has none of the bitcoin family's fee, edit-transaction or staking pieces.
 */
const family: ZcashFamily = {
  sendAmountFields,
  sendRecipientFields,
  StepReceiveFundsPostAlert,
  StepReceiveFundsDeviceAnimation,
  // A Zcash account with a shielded address confirms its transparent and shielded
  // addresses with a single device exchange, so the shared receive step must not
  // also run the standard transparent-only confirmation. Anything else — no
  // shielded address yet, or the feature turned off — keeps the standard path.
  useCustomConfirmAddress: (account, featureFlags) =>
    !!featureFlags.zcashShielded?.enabled && !!account.privateInfo?.shieldedAddress,
  SendStepRecipientFromSelector,
  SendStepAboveRecipientInput,
  SendModalTitle,
  SendRecipientNotice: ZcashSyncNotice,
  getAccountRecipientAddresses,
  AccountBalanceSummaryFooter,
  operationDetails,
  PostBroadcastEffect,
  SendAmountEffect: ZcashAmountStepSync,
  modalsToPreload: ["MODAL_ZCASH_EXPORT_KEY"],
};

export default family;
