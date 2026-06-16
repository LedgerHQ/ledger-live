import operationDetails from "./operationDetails";
import sendRecipientFields from "./SendRecipientFields";
import StepReceiveFunds from "./StepReceiveFunds";
import TooManyUtxosModal from "./TooManyUtxosModal";
import { CantonFamily } from "./types";
import PendingTransferProposals from "./PendingTransferProposals";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import StepSummaryAdditionalRows from "./StepSummaryAdditionalRows";
import ModularDrawerAddAccountFlowManager from "./ModularDrawerAddAccountFlowManager";

const family: CantonFamily = {
  operationDetails,
  sendRecipientFields,
  StepReceiveFunds,
  TooManyUtxosModal,
  PendingTransferProposals,
  AccountBalanceSummaryFooter,
  StepSummaryAdditionalRows,
  ModularDrawerAddAccountFlowManager,
  modalsToPreload: [
    "MODAL_CANTON_ONBOARD_ACCOUNT",
    "MODAL_CANTON_TOO_MANY_UTXOS",
    "MODAL_CANTON_TERMS",
  ],
};

export default family;
