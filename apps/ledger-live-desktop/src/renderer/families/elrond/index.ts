import {
  ElrondAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/elrond/types";
import { LLDCoinFamily } from "../types";
import operationDetails from "./operationDetails";
import modals from "./modals";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import StakeBanner from "./StakeBanner";

const family: LLDCoinFamily<ElrondAccount, Transaction, TransactionStatus> = {
  operationDetails,
  accountHeaderManageActions,
  modals,
  AccountBodyHeader,
  AccountSubHeader,
  AccountBalanceSummaryFooter,
  StakeBanner,
};

export default family;
