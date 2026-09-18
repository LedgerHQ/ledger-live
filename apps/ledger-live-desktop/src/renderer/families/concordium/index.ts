import AccountSubHeader from "./AccountSubHeader";
import StepReceiveFunds from "./StepReceiveFunds";
import SendRecipientFields from "./SendRecipientFields";
import operationDetails from "./operationDetails";
import { ConcordiumFamily } from "./types";

const family: ConcordiumFamily = {
  AccountSubHeader,
  StepReceiveFunds,
  sendRecipientFields: SendRecipientFields,
  operationDetails,
  useCustomConfirmAddress: true,
  modalsToPreload: ["MODAL_CONCORDIUM_ONBOARD_ACCOUNT"],
};

export default family;
