import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import sendAmountFields from "./SendAmountFields";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import { CardanoFamily } from "./types";

const family: CardanoFamily = {
  AccountBodyHeader,
  AccountSubHeader,
  sendAmountFields,
  AccountBalanceSummaryFooter,
  accountHeaderManageActions,
};

export default family;
