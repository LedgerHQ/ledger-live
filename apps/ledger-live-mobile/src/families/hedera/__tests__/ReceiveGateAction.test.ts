import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";
import receiveGateAction from "../ReceiveGateAction";
import { HEDERA_ACCOUNT_1 } from "../__mocks__/account.mock";
import { htsToken } from "../__mocks__/currency.mock";

const navigate = jest.fn();
const navigation = { navigate } as unknown as NativeStackNavigationProp<ParamListBase>;

describe("hedera ReceiveGateAction", () => {
  beforeEach(() => navigate.mockClear());

  it("opens the association summary of the token the receive screen asks for", () => {
    receiveGateAction({ navigation, account: HEDERA_ACCOUNT_1, token: htsToken });

    expect(navigate).toHaveBeenCalledWith(NavigatorName.HederaAssociateTokenFlow, {
      screen: ScreenName.HederaAssociateTokenSummary,
      params: { accountId: HEDERA_ACCOUNT_1.id, token: htsToken },
    });
  });

  it("opens the token selection without a token", () => {
    receiveGateAction({ navigation, account: HEDERA_ACCOUNT_1 });

    expect(navigate).toHaveBeenCalledWith(NavigatorName.HederaAssociateTokenFlow, {
      screen: ScreenName.HederaAssociateTokenSelectToken,
      params: { accountId: HEDERA_ACCOUNT_1.id },
    });
  });
});
