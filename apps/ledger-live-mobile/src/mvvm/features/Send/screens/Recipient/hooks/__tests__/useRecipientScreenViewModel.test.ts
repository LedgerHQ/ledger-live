import { act, renderHook } from "@testing-library/react-native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { useSendFlowActions, useSendFlowData } from "../../../../context/SendFlowContext";
import { createMockAccount } from "./accounts";
import { useRecipientScreenViewModel } from "../useRecipientScreenViewModel";

jest.mock("@ledgerhq/live-common/account/index");
jest.mock("@react-navigation/native");
jest.mock("../../../../context/SendFlowContext");

const mockedGetAccountCurrency = jest.mocked(getAccountCurrency);
const mockedUseNavigation = jest.mocked(useNavigation);
const mockedUseSendFlowActions = jest.mocked(useSendFlowActions);
const mockedUseSendFlowData = jest.mocked(useSendFlowData);

const account = createMockAccount({ id: "account_1" });

describe("useRecipientScreenViewModel", () => {
  const clearRecipientSearch = jest.fn();
  const setRecipient = jest.fn();
  const navigate = jest.fn();
  const goBack = jest.fn();
  const getState = jest.fn(() => ({
    routes: [{ name: ScreenName.SendFlowRecipient }],
    index: 0,
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAccountCurrency.mockReturnValue(account.currency);
    mockedUseNavigation.mockReturnValue({ navigate, goBack, getState } as never);
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
    expect(navigate).toHaveBeenCalledWith(ScreenName.SendFlowAmount);
  });

  it("updates the recipient without navigating when goToNextStep is false", () => {
    const { result } = renderHook(() => useRecipientScreenViewModel());
    if (!result.current.ready) {
      throw new Error("Expected a ready recipient screen");
    }
    const viewModel = result.current;

    act(() => {
      viewModel.onAddressSelected("destination", "name.eth", false);
    });

    expect(setRecipient).toHaveBeenCalledWith({
      address: "destination",
      ensName: "name.eth",
      memo: { type: "MEMO", value: "123" },
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("sets the provided memo and continues to amount", () => {
    const { result } = renderHook(() => useRecipientScreenViewModel());
    if (!result.current.ready) {
      throw new Error("Expected a ready recipient screen");
    }
    const viewModel = result.current;

    act(() => {
      viewModel.onAddressSelected("destination", undefined, true, {
        value: "",
        type: "NO_MEMO",
      });
    });

    expect(setRecipient).toHaveBeenCalledWith({
      address: "destination",
      ensName: undefined,
      memo: { value: "", type: "NO_MEMO" },
    });
    expect(navigate).toHaveBeenCalledWith(ScreenName.SendFlowAmount);
  });

  it("returns to the existing Amount screen instead of stacking another", () => {
    getState.mockReturnValue({
      routes: [{ name: ScreenName.SendFlowAmount }, { name: ScreenName.SendFlowRecipient }],
      index: 1,
    });
    const { result } = renderHook(() => useRecipientScreenViewModel());
    if (!result.current.ready) {
      throw new Error("Expected a ready recipient screen");
    }
    const viewModel = result.current;

    act(() => {
      viewModel.onAddressSelected("destination");
    });

    expect(goBack).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });
});
