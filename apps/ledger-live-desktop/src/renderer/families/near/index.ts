import operationDetails from "./operationDetails";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import StakeBanner from "./StakeBanner";
import { NearFamily } from "./types";

const family: NearFamily = {
  operationDetails,
  accountHeaderManageActions,
  AccountBodyHeader,
  AccountSubHeader,
  AccountBalanceSummaryFooter,
  StakeBanner,
  modalsToPreload: [
    "MODAL_NEAR_STAKE",
    "MODAL_NEAR_REWARDS_INFO",
    "MODAL_NEAR_UNSTAKE",
    "MODAL_NEAR_WITHDRAW",
  ],
};

export default family;
