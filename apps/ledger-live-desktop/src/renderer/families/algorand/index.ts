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
};

export default family;
