import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import sendRecipientFields from "./SendRecipientFields";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import StakeBanner from "./StakeBanner";
import { SolanaFamily } from "./types";

const family: SolanaFamily = {
  accountHeaderManageActions,
  AccountBodyHeader,
  AccountSubHeader,
  sendRecipientFields,
  AccountBalanceSummaryFooter,
  StakeBanner,
};

export default family;
