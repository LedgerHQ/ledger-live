import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import operationDetails from "./operationDetails";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import StakeBanner from "./StakeBanner";
import { InternetComputerFamily } from "./types";

const family: InternetComputerFamily = {
  operationDetails,
  sendAmountFields,
  sendRecipientFields,
  accountHeaderManageActions,
  AccountBalanceSummaryFooter,
  StakeBanner,
  modalsToPreload: ["MODAL_ICP_LIST_NEURONS", "MODAL_ICP_REFRESH_VOTING_POWER"],
};

export default family;
