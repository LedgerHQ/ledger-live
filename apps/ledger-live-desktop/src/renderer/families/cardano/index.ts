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
  modalsToPreload: [
    "MODAL_CARDANO_DELEGATE",
    "MODAL_CARDANO_UNDELEGATE",
    "MODAL_CARDANO_REWARDS_INFO",
    "MODAL_CARDANO_UNDELEGATE_SELF_TX_INFO",
  ],
};

export default family;
