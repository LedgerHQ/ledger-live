import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";
import receiveGateAction from "../ReceiveGateAction";
import { XRP_ACCOUNT } from "../__mocks__/account.mock";
import { xrpIouToken } from "../__mocks__/currency.mock";

const navigate = jest.fn();
const navigation = { navigate } as unknown as NativeStackNavigationProp<ParamListBase>;

describe("xrp ReceiveGateAction", () => {
  beforeEach(() => navigate.mockClear());

  it("adds the token the receive screen asks for", () => {
    receiveGateAction({ navigation, account: XRP_ACCOUNT, token: xrpIouToken });

    expect(navigate).toHaveBeenCalledWith(NavigatorName.XrpAddTokenFlow, {
      screen: ScreenName.XrpAddTokenSettings,
      params: { accountId: XRP_ACCOUNT.id, token: xrpIouToken },
    });
  });

  it("opens the token selection without a token", () => {
    receiveGateAction({ navigation, account: XRP_ACCOUNT });

    expect(navigate).toHaveBeenCalledWith(NavigatorName.XrpAddTokenFlow, {
      screen: ScreenName.XrpAddTokenSelectToken,
      params: { accountId: XRP_ACCOUNT.id },
    });
  });
});
