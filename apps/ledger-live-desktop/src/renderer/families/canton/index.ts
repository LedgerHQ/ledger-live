import operationDetails from "./operationDetails";
import sendRecipientFields from "./SendRecipientFields";
import StepReceiveFunds from "./StepReceiveFunds";
import TooManyUtxosModal from "./TooManyUtxosModal";
import { CantonFamily } from "./types";
import PendingTransferProposals from "./PendingTransferProposals";

const family: CantonFamily = {
  operationDetails,
  sendRecipientFields,
  StepReceiveFunds,
  TooManyUtxosModal,
  PendingTransferProposals,
};

export default family;
