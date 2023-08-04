import AccountBodyHeader from "./AccountBodyHeader";
import AccountSubHeader from "./AccountSubHeader";
import sendAmountFields from "./SendAmountFields";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import { CardanoFamily } from "./types";

const family: CardanoFamily = {
  AccountBodyHeader,
  AccountSubHeader,
  sendAmountFields,
  AccountBalanceSummaryFooter,
};

export default family;
