// Zcash keeps wallet-btc's transparent account model, and with it the secp256k1 workers the
// bitcoin family sets up for address derivation.
import "../bitcoin/live-common-setup";
import sendAmountFields from "../bitcoin/SendAmountFields";
import sendRecipientFields from "../bitcoin/SendRecipientFields";
import StepReceiveFundsPostAlert from "../bitcoin/StepReceiveFundsPostAlert";
import StepReceiveFundsDeviceAnimation from "../bitcoin/ZcashReceiveDeviceAnimation";
import SendStepRecipientFromSelector from "../bitcoin/ZcashTransferFromSelector";
import SendStepAboveRecipientInput from "../bitcoin/ZcashSelfTransferToggle";
import SendModalTitle from "../bitcoin/SendModalTitle";
import AccountBalanceSummaryFooter from "../bitcoin/AccountBalanceSummaryFooter";
import operationDetails from "../bitcoin/operationDetails";
import PostBroadcastEffect from "../bitcoin/ZcashPostBroadcastSync";
import { ZcashAmountStepSync } from "../bitcoin/ZcashAmountStepSync";
import { ZcashSyncNotice } from "../bitcoin/ZcashSyncNotice";
import { getAccountRecipientAddresses } from "../bitcoin/getAccountRecipientAddresses";
import type { BitcoinFamily } from "../bitcoin/types";
import type { ZcashAccount } from "@ledgerhq/coin-zcash/types/bridge";

/**
 * The Zcash currencies' own family. Zcash has no fee market, no RBF and no coin control,
 * so none of the bitcoin family's fee, edit-transaction or staking pieces apply.
 *
 * Typed as the bitcoin family for now: the components it reuses are typed for bitcoin
 * accounts, which a Zcash account extends.
 */
const family: BitcoinFamily = {
  sendAmountFields,
  sendRecipientFields,
  StepReceiveFundsPostAlert,
  StepReceiveFundsDeviceAnimation,
  // A Zcash account with a shielded address confirms its transparent and shielded
  // addresses with a single device exchange, so the shared receive step must not
  // also run the standard transparent-only confirmation. Anything else — no
  // shielded address yet, or the feature turned off — keeps the standard path.
  useCustomConfirmAddress: (account, featureFlags) =>
    !!featureFlags.zcashShielded?.enabled &&
    !!(account as ZcashAccount).privateInfo?.shieldedAddress,
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
