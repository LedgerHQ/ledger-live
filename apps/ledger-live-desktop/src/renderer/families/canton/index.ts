import operationDetails from "./operationDetails";
import sendRecipientFields from "./SendRecipientFields";
import StepReceiveFunds from "./StepReceiveFunds";
import TooManyUtxosModal from "./TooManyUtxosModal";
import { CantonFamily } from "./types";
import PendingTransferProposals from "./PendingTransferProposals";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import StepSummaryAdditionalRows from "./StepSummaryAdditionalRows";

const family: CantonFamily = {
  operationDetails,
  sendRecipientFields,
  StepReceiveFunds,
  TooManyUtxosModal,
  PendingTransferProposals,
  AccountBalanceSummaryFooter,
  StepSummaryAdditionalRows,
};

export default family;
