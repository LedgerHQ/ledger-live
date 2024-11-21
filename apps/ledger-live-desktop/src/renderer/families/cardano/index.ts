import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import sendRecipientFields from "./SendRecipientFields";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import { CardanoFamily } from "./types";

const family: CardanoFamily = {
  AccountBodyHeader,
  AccountSubHeader,
  sendRecipientFields,
  AccountBalanceSummaryFooter,
  accountHeaderManageActions,
};

export default family;
