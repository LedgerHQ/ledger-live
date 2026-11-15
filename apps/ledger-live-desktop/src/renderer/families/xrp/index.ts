import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import StepReceiveAccountCustomAlert from "./StepReceiveAccountCustomAlert";
import addAssetAction from "./addAssetAction";
import sendAmountFields from "./SendAmountFields";
import sendRecipientFields from "./SendRecipientFields";
import operationDetails from "./operationDetails";
import tokenList from "./TokenList";
import type { XrpFamily } from "./types";

const family: XrpFamily = {
  operationDetails,
  sendRecipientFields,
  sendRecipientCanNext: status => !status.errors.transaction,
  sendAmountFields,
  tokenList,
  addAssetAction,
  getTokenTypes: currency => getXrpEnabledTokenStandards(currency.id),
  AccountBalanceSummaryFooter,
  StepReceiveAccountCustomAlert,
  modalsToPreload: ["MODAL_XRP_ADD_TOKEN"],
};

export default family;
