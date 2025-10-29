import operationDetails from "./operationDetails";
import sendRecipientFields from "./SendRecipientFields";
import StepReceiveFunds from "./StepReceiveFunds";
import TooManyUtxosModal from "./TooManyUtxosModal";
import { CantonFamily } from "./types";

const family: CantonFamily = {
  operationDetails,
  sendRecipientFields,
  StepReceiveFunds,
  TooManyUtxosModal,
};

export default family;
