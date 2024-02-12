import operationDetails from "./operationDetails";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import StakeBanner from "./StakeBanner";
import { ElrondFamily } from "./types";

const family: ElrondFamily = {
  operationDetails,
  accountHeaderManageActions,
  AccountBodyHeader,
  AccountSubHeader,
  AccountBalanceSummaryFooter,
  StakeBanner,
};

export default family;
