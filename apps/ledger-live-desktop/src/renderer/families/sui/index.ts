import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import operationDetails from "./operationDetails";
import type { CoinModalKey } from "../modals-loaders";

const modalsToPreload: CoinModalKey[] = ["MODAL_SUI_DELEGATE", "MODAL_SUI_UNSTAKE"];

const family = {
  accountHeaderManageActions,
  AccountBalanceSummaryFooter,
  AccountBodyHeader,
  operationDetails,
  modalsToPreload,
};

export default family;
