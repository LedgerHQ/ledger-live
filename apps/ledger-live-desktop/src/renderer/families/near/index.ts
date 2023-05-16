import {
  NearAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/near/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import modals, { ModalsData } from "./modals";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import StakeBanner from "./StakeBanner";

const family: LLDCoinFamily<NearAccount, Transaction, TransactionStatus, ModalsData> = {
  operationDetails,
  accountHeaderManageActions,
  modals,
  AccountBodyHeader,
  AccountSubHeader,
  AccountBalanceSummaryFooter,
  StakeBanner,
};

export default family;
