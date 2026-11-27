import { NavigatorName, ScreenName } from "~/const";
import type { ReceiveGateAction } from "../types";

const receiveGateAction: ReceiveGateAction = ({ navigation, account, token }) => {
  navigation.navigate(
    NavigatorName.HederaAssociateTokenFlow,
    token
      ? { screen: ScreenName.HederaAssociateTokenSummary, params: { accountId: account.id, token } }
      : { screen: ScreenName.HederaAssociateTokenSelectToken, params: { accountId: account.id } },
  );
};

export default receiveGateAction;
