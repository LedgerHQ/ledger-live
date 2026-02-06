import { renderHook } from "@tests/test-renderer";
import { useTransferDrawerViewModel } from "../useTransferDrawerViewModel";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { overrideStateWithFunds } from "LLM/features/QuickActions/__integrations__/shared";
import { State } from "~/reducers/types";

const mockNavigate = jest.fn();
const mockHandleOpenReceiveDrawer = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("LLM/features/Receive", () => ({
  useOpenReceiveDrawer: () => ({ handleOpenReceiveDrawer: mockHandleOpenReceiveDrawer }),
}));

jest.mock("LLM/features/Noah/useNoahEntryPoint", () => ({
  useReceiveNoahEntry: () => ({ showNoahMenu: true }),
}));

const SOURCE_SCREEN = "Portfolio";

const overrideWithOpenDrawer = (state: State): State => {
  const base = overrideStateWithFunds(state);
  return {
    ...base,
    transferDrawer: {
      isOpen: true,
      sourceScreenName: SOURCE_SCREEN,
    },
  };
};

describe("TransferDrawer Navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderViewModel = () =>
    renderHook(() => useTransferDrawerViewModel(), {
      overrideInitialState: overrideWithOpenDrawer,
    });

  const findAction = (
    result: { current: ReturnType<typeof useTransferDrawerViewModel> },
    id: string,
  ) => result.current.actions.find(a => a.id === id)!;

  it("send navigates to SendFunds/SendCoin and tracks", () => {
    const { result } = renderViewModel();

    findAction(result, "send").onPress();

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.SendFunds, {
      screen: ScreenName.SendCoin,
    });
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "quick_action_transfer",
      flow: "send",
      page: SOURCE_SCREEN,
    });
  });

  it("bank_transfer navigates to ReceiveFunds/ReceiveProvider with noah manifest and tracks", () => {
    const { result } = renderViewModel();

    findAction(result, "bank_transfer").onPress();

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveProvider,
      params: { manifestId: "noah" },
    });
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "quick_action_transfer",
      flow: "bank_transfer",
      page: SOURCE_SCREEN,
    });
  });

  it("receive opens receive drawer and tracks", () => {
    const { result } = renderViewModel();

    findAction(result, "receive").onPress();

    expect(mockHandleOpenReceiveDrawer).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "quick_action_transfer",
      flow: "receive",
      page: SOURCE_SCREEN,
    });
  });
});
