import type { ReceiveGateAction } from "../types";
import addAssetAction from "./AddAssetAction";

const receiveGateAction: ReceiveGateAction = ({ navigation, account }) =>
  addAssetAction(navigation, account.id);

export default receiveGateAction;
