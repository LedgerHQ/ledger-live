import StepReceiveFunds from "./StepReceiveFunds";
import SendRecipientFields from "./SendRecipientFields";
import { ConcordiumFamily } from "./types";

const family: ConcordiumFamily = {
  StepReceiveFunds,
  sendRecipientFields: SendRecipientFields,
  useCustomConfirmAddress: true,
  modalsToPreload: ["MODAL_CONCORDIUM_ONBOARD_ACCOUNT"],
};

export default family;
