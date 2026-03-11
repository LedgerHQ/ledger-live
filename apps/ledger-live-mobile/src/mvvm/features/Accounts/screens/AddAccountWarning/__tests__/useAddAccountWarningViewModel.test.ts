import { renderHook } from "@tests/test-renderer";
import useAddAccountWarningViewModel from "../useAddAccountWarningViewModel";
import type { Props } from "../useAddAccountWarningViewModel";
import { AddAccountContexts } from "../../AddAccount/enums";
import { ScreenName } from "~/const";

const navigate = jest.fn();
const goBack = jest.fn();

jest.mock("~/analytics", () => ({ track: jest.fn() }));

jest.mock("@react-navigation/native", () => {
  const React = require("react");
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useNavigationIndependentTree: actual.useNavigationIndependentTree || (() => ({})),
  };
});

jest.mock("@react-navigation/core", () => ({
  useNavigation: () => ({ navigate, goBack }),
}));

jest.mock("styled-components/native", () => ({
  ...jest.requireActual("styled-components/native"),
  useTheme: () => ({
    colors: { warning: { c70: "#FFA500" } },
    space: [0, 4, 8, 16, 24, 32],
  }),
}));

jest.mock("LLM/hooks/useAnalytics", () => ({
  __esModule: true,
  default: () => ({
    analyticsMetadata: {
      [ScreenName.AddAccountsWarning]: {
        onSelectAccount: { eventName: "select_account", payload: { page: "warning" } },
      },
    },
  }),
}));

const makeProps = (
  context: AddAccountContexts,
  onCloseNavigation?: () => void,
): Props =>
  ({
    route: {
      params: {
        emptyAccount: { id: "eth-empty", name: "Ethereum Empty" },
        emptyAccountName: "Ethereum Empty",
        currency: { id: "ethereum", name: "Ethereum", type: "CryptoCurrency" },
        context,
        onCloseNavigation,
      },
    },
  }) as unknown as Props;

describe("useAddAccountWarningViewModel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should navigate to Account screen when context is AddAccounts", () => {
    const { result } = renderHook(() =>
      useAddAccountWarningViewModel(makeProps(AddAccountContexts.AddAccounts)),
    );

    result.current.goToAccounts("eth-1")();

    expect(navigate).toHaveBeenCalledWith(ScreenName.Account, { accountId: "eth-1" });
  });

  it("should navigate to ReceiveConfirmation when context is ReceiveFunds", () => {
    const { result } = renderHook(() =>
      useAddAccountWarningViewModel(makeProps(AddAccountContexts.ReceiveFunds)),
    );

    result.current.goToAccounts("eth-1")();

    expect(navigate).toHaveBeenCalledWith(
      "ReceiveFunds",
      expect.objectContaining({
        screen: "ReceiveConfirmation",
        params: expect.objectContaining({ accountId: "eth-1" }),
      }),
    );
  });

  it("should call onCloseNavigation when provided", () => {
    const onCloseNavigation = jest.fn();
    const { result } = renderHook(() =>
      useAddAccountWarningViewModel(
        makeProps(AddAccountContexts.AddAccounts, onCloseNavigation),
      ),
    );

    result.current.handleOnCloseWarningScreen();

    expect(onCloseNavigation).toHaveBeenCalled();
    expect(goBack).not.toHaveBeenCalled();
  });

  it("should fallback to navigation.goBack when onCloseNavigation is undefined", () => {
    const { result } = renderHook(() =>
      useAddAccountWarningViewModel(makeProps(AddAccountContexts.AddAccounts)),
    );

    result.current.handleOnCloseWarningScreen();

    expect(goBack).toHaveBeenCalled();
  });

  it("should return emptyAccount and currency from route params", () => {
    const { result } = renderHook(() =>
      useAddAccountWarningViewModel(makeProps(AddAccountContexts.AddAccounts)),
    );

    expect(result.current.emptyAccount).toEqual(
      expect.objectContaining({ id: "eth-empty" }),
    );
    expect(result.current.emptyAccountName).toBe("Ethereum Empty");
    expect(result.current.currency).toEqual(
      expect.objectContaining({ id: "ethereum" }),
    );
  });
});
