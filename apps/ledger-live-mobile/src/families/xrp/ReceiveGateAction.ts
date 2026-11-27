import type { ReceiveGateAction } from "../types";
import { navigateToAddToken } from "./utils";

const receiveGateAction: ReceiveGateAction = ({ navigation, account, token }) =>
  navigateToAddToken(navigation, account.id, token);

export default receiveGateAction;
