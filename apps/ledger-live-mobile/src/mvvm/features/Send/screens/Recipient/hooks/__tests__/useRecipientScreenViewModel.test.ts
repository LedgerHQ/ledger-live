import { act, renderHook } from "@testing-library/react-native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { screen as trackScreen } from "~/analytics";
import { useSendFlowActions, useSendFlowData } from "../../../../context/SendFlowContext";
import { createMockAccount } from "./accounts";
import { useRecipientScreenViewModel } from "../useRecipientScreenViewModel";

jest.mock("@ledgerhq/live-common/account/index");
jest.mock("@react-navigation/native");
jest.mock("../../../../context/SendFlowContext");
jest.mock("~/analytics", () => ({
  screen: jest.fn(),
  track: jest.fn(),
}));
jest.mock("@features/platform-contacts", () => ({
  useContacts: jest.fn(() => []),
  useContactsFeature: jest.fn(() => ({ isEnabled: false, eligibleAddressFamilies: [] })),
}));

const mockedGetAccountCurrency = jest.mocked(getAccountCurrency);
const mockedUseNavigation = jest.mocked(useNavigation);
const mockedUseSendFlowActions = jest.mocked(useSendFlowActions);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);

const account = createMockAccount({ id: "account_1" });

describe("useRecipientScreenViewModel", () => {
  const clearRecipientSearch = jest.fn();
  const setRecipient = jest.fn();
  const navigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAccountCurrency.mockReturnValue(account.currency);
    mockedUseNavigation.mockReturnValue({ navigate } as never);
    mockedUseSendFlowActions.mockReturnValue({
      transaction: { setRecipient },
    } as never);
    mockedUseSendFlowData.mockReturnValue({
      state: {
        account: { account, parentAccount: null, currency: null },
        recipient: { memo: { type: "MEMO", value: "123" } },
        transaction: { transaction: null },
      },
      uiConfig: { recipientSupportsDomain: true },
      recipientSearch: {
        value: "",
        setValue: jest.fn(),
        clear: clearRecipientSearch,
      },
    } as never);
  });

  it("exposes ready screen inputs from external flow systems", () => {
    const { result } = renderHook(() => useRecipientScreenViewModel());

    expect(result.current).toMatchObject({
      ready: true,
      account,
      currency: account.currency,
      recipientSupportsDomain: true,
      parentAccount: null,
      transaction: null,
    });
    expect(mockedGetAccountCurrency).toHaveBeenCalledWith(account);
    expect(jest.mocked(trackScreen)).toHaveBeenCalledWith(
      "Modal send - step recipient",
      undefined,
      expect.objectContaining({
        hasContacts: false,
        contactsCount: 0,
      }),
    );
  });

  it("updates the recipient and navigates to amount", () => {
    const { result } = renderHook(() => useRecipientScreenViewModel());
    if (!result.current.ready) {
      throw new Error("Expected a ready recipient screen");
    }
    const viewModel = result.current;

    act(() => {
      viewModel.onAddressSelected("destination", "name.eth");
    });

    expect(setRecipient).toHaveBeenCalledWith({
      address: "destination",
      ensName: "name.eth",
      memo: { type: "MEMO", value: "123" },
    });
    expect(clearRecipientSearch).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(ScreenName.SendFlowAmount);
  });

  it("clears the recipient search before proceeding after memo", () => {
    const { result } = renderHook(() => useRecipientScreenViewModel());
    if (!result.current.ready) {
      throw new Error("Expected a ready recipient screen");
    }
    const viewModel = result.current;

    act(() => {
      viewModel.onMemoProceed();
    });

    expect(clearRecipientSearch).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(ScreenName.SendFlowAmount);
  });
});
