import operationDetails from "./operationDetails";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
import tokenList from "./TokenList";
import { AlgorandFamily } from "./types";

const family: AlgorandFamily = {
  operationDetails,
  tokenList,
  accountHeaderManageActions,
  AccountBodyHeader,
  modalsToPreload: [
    "MODAL_ALGORAND_OPT_IN",
    "MODAL_ALGORAND_CLAIM_REWARDS",
    "MODAL_ALGORAND_EARN_REWARDS_INFO",
  ],
};

export default family;
