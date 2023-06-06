import {
  SolanaAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/solana/types";
import { LLDCoinFamily } from "../types";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import sendRecipientFields from "./SendRecipientFields";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import StakeBanner from "./StakeBanner";

const family: LLDCoinFamily<SolanaAccount, Transaction, TransactionStatus> = {
  accountHeaderManageActions,
  AccountBodyHeader,
  AccountSubHeader,
  sendRecipientFields,
  AccountBalanceSummaryFooter,
  StakeBanner,
};

export default family;
