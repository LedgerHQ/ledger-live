import AccountSubHeader from "./AccountSubHeader";
import sendAmountFields from "./SendAmountFields";
import operationDetails from "./operationDetails";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import AccountBodyHeader from "./AccountBodyHeader";
import StakeBanner from "./StakeBanner";
import { MinaFamily } from "./types";

const family: MinaFamily = {
  AccountSubHeader,
  operationDetails,
  sendAmountFields,
  accountHeaderManageActions,
  AccountBalanceSummaryFooter,
  AccountBodyHeader,
  StakeBanner,
};

export default family;
