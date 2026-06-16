import operationDetails from "./operationDetails";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import { AptosFamily } from "./types";

const family: AptosFamily = {
  operationDetails,
  accountHeaderManageActions,
  AccountBodyHeader,
  AccountBalanceSummaryFooter,
  modalsToPreload: [
    "MODAL_APTOS_STAKE",
    "MODAL_APTOS_REWARDS_INFO",
    "MODAL_APTOS_UNSTAKE",
    "MODAL_APTOS_WITHDRAW",
    "MODAL_APTOS_RESTAKE",
  ],
};

export default family;
