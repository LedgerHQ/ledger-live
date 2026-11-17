import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import StepReceiveAccountCustomAlert from "./StepReceiveAccountCustomAlert";
import addAssetAction from "./addAssetAction";
import sendAmountFields from "./SendAmountFields";
import SendAmountFooterRow from "./SendAmountFooterRow";
import sendRecipientFields from "./SendRecipientFields";
import SendRecipientNotice from "./SendRecipientNotice";
import operationDetails from "./operationDetails";
import tokenList from "./TokenList";
import type { XrpFamily } from "./types";

const family: XrpFamily = {
  operationDetails,
  sendRecipientFields,
  sendRecipientCanNext: status => !status.errors.transaction,
  SendRecipientNotice,
  sendAmountFields,
  SendAmountFooterRow,
  tokenList,
  addAssetAction,
  getTokenTypes: currency => getXrpEnabledTokenStandards(currency.id),
  AccountBalanceSummaryFooter,
  accountHeaderManageActions,
  StepReceiveAccountCustomAlert,
  modalsToPreload: ["MODAL_XRP_ADD_TOKEN", "MODAL_XRP_MANAGE_TOKEN"],
};

export default family;
