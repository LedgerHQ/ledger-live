import { renderHook } from "@tests/test-renderer";
import useAddAccountSuccessViewModel from "../useAddAccountSuccessViewModel";
import type { Props } from "../useAddAccountSuccessViewModel";
import { AddAccountContexts } from "../../AddAccount/enums";
import { ScreenName } from "~/const";

const navigate = jest.fn();

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
  useNavigation: () => ({ navigate }),
}));

jest.mock("styled-components/native", () => ({
  ...jest.requireActual("styled-components/native"),
  useTheme: () => ({
    colors: { neutral: { c100: "#000" } },
    space: [0, 4, 8, 16, 24, 32],
  }),
}));

jest.mock("LLM/hooks/useAnalytics", () => ({
  __esModule: true,
  default: () => ({
    analyticsMetadata: {
      [ScreenName.AddAccountsSuccess]: {
        onSelectAccount: { eventName: "select_account", payload: { page: "success" } },
      },
    },
  }),
}));

const makeProps = (context: AddAccountContexts, extraParams = {}): Props =>
  ({
    route: {
      params: {
        currency: { id: "ethereum", name: "Ethereum", type: "CryptoCurrency" },
        accountsToAdd: [{ id: "eth-1", name: "Ethereum 1" }],
        context,
        onCloseNavigation: jest.fn(),
        ...extraParams,
      },
    },
  }) as unknown as Props;

describe("useAddAccountSuccessViewModel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should navigate to Account screen when context is AddAccounts", () => {
    const { result } = renderHook(() =>
      useAddAccountSuccessViewModel(makeProps(AddAccountContexts.AddAccounts)),
    );

    result.current.goToAccounts("eth-1")();

    expect(navigate).toHaveBeenCalledWith(ScreenName.Account, { accountId: "eth-1" });
  });

  it("should navigate to ReceiveConfirmation when context is ReceiveFunds", () => {
    const { result } = renderHook(() =>
      useAddAccountSuccessViewModel(makeProps(AddAccountContexts.ReceiveFunds)),
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

  it("should extract keyExtractor returning item.id", () => {
    const { result } = renderHook(() =>
      useAddAccountSuccessViewModel(makeProps(AddAccountContexts.AddAccounts)),
    );

    const item = { id: "test-account-id" } as Parameters<typeof result.current.keyExtractor>[0];
    expect(result.current.keyExtractor(item)).toBe("test-account-id");
  });

  it("should return currency and accountsToAdd from route params", () => {
    const { result } = renderHook(() =>
      useAddAccountSuccessViewModel(makeProps(AddAccountContexts.AddAccounts)),
    );

    expect(result.current.currency).toEqual(
      expect.objectContaining({ id: "ethereum" }),
    );
    expect(result.current.accountsToAdd).toHaveLength(1);
  });
});
