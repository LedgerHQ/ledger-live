import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import AccountDialogs from "./AccountDialogs";
import AccountSubHeader from "./AccountSubHeader";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import StepReceiveAccountCustomAlert from "./StepReceiveAccountCustomAlert";
import accountActions from "./accountActions";
import addAssetAction from "./addAssetAction";
import manageAssetsAction from "./manageAssetsAction";
import sendAmountFields from "./SendAmountFields";
import SendAmountFooterRow from "./SendAmountFooterRow";
import sendRecipientFields from "./SendRecipientFields";
import SendRecipientNotice from "./SendRecipientNotice";
import operationDetails from "./operationDetails";
import tokenList from "./TokenList";
import type { XrpFamily } from "./types";
import { isFrozenToken } from "./utils";

const family: XrpFamily = {
  operationDetails,
  sendRecipientFields,
  sendRecipientCanNext: status => !status.errors.transaction,
  SendRecipientNotice,
  sendAmountFields,
  SendAmountFooterRow,
  tokenList,
  addAssetAction,
  manageAssetsAction,
  getTokenTypes: currency => getXrpEnabledTokenStandards(currency.id),
  AccountBalanceSummaryFooter,
  AccountSubHeader,
  accountActions,
  isTransferDisabled: isFrozenToken,
  accountHeaderManageActions,
  AccountDialog: AccountDialogs,
  StepReceiveAccountCustomAlert,
  modalsToPreload: ["MODAL_XRP_ADD_TOKEN", "MODAL_XRP_MANAGE_TOKEN"],
};

export default family;
