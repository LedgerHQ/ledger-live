import operationDetails from "./operationDetails";
import tokenList from "./TokenList";
import { AlgorandFamily } from "./types";

const family: AlgorandFamily = {
  operationDetails,
  tokenList,
  modalsToPreload: ["MODAL_ALGORAND_OPT_IN"],
};

export default family;
