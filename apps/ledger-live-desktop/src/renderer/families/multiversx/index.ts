import operationDetails from "./operationDetails";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import StakeBanner from "./StakeBanner";
import { MultiversXFamily } from "./types";

const family: MultiversXFamily = {
  operationDetails,
  accountHeaderManageActions,
  AccountBodyHeader,
  AccountSubHeader,
  AccountBalanceSummaryFooter,
  StakeBanner,
  modalsToPreload: [
    "MODAL_MULTIVERSX_DELEGATE",
    "MODAL_MULTIVERSX_REWARDS_INFO",
    "MODAL_MULTIVERSX_UNDELEGATE",
    "MODAL_MULTIVERSX_CLAIM_REWARDS",
    "MODAL_MULTIVERSX_WITHDRAW",
  ],
};

export default family;
