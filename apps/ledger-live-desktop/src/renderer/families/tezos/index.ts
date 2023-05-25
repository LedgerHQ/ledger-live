import AccountBodyHeader from "./AccountBodyHeader";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import receiveWarning from "./ReceiveWarning";
import sendWarning from "./SendWarning";
import transactionConfirmFields from "./TransactionConfirmFields";
import accountActions from "./accountActions";
import operationDetails from "./operationDetails";
import { TezosFamily } from "./types";

const family: TezosFamily = {
  operationDetails,
  accountActions,
  accountHeaderManageActions,
  transactionConfirmFields,
  sendWarning,
  receiveWarning,
  AccountBodyHeader,
};

export default family;
