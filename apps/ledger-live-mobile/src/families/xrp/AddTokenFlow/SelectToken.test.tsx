import React from "react";
import { act, render, screen, within } from "@tests/test-renderer";
import { type TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { lockApp, unlockApp } from "@features/platform-app-lock";
import { useTokensData } from "@features/platform-currencies";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { ScreenName } from "~/const";
import SelectToken from "./SelectToken";
import type { Props } from "./useSelectTokenViewModel";
import {
  XRP_ACCOUNT,
  XRP_ACCOUNT_WITH_TOKEN,
  overrideWithAccounts,
} from "../__mocks__/account.mock";
import { xrpIouToken, xrpMptToken } from "../__mocks__/currency.mock";

jest.mock("@features/platform-currencies");

jest.mock("@ledgerhq/live-common/families/xrp/config", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
    getXrpEnabledTokenStandards: jest.fn(),
  };
});

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  const RN = jest.requireActual("react-native");

  return {
    ...actual,
    BottomSheetView: (props: { children?: React.ReactNode }) => {
      return <RN.View testID="measured-sheet-view">{props.children}</RN.View>;
    },
  };
});

const sameTickerOtherIssuerToken: TokenCurrency = {
  ...xrpIouToken,
  id: TokenCurrencyIdSchema.parse("ripple_testnet/iou/rlusd-other-issuer"),
  contractAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
};

const mockUseTokensData = jest.mocked(useTokensData);
const mockGetXrpEnabledTokenStandards = jest.mocked(getXrpEnabledTokenStandards);
const mockNavigate = jest.fn();
const mockPopFlow = jest.fn();

const navigation = {
  navigate: mockNavigate,
  getParent: () => ({ pop: mockPopFlow }),
} as unknown as Props["navigation"];
const route = {
  key: "test",
  name: ScreenName.XrpAddTokenSelectToken,
  params: { accountId: XRP_ACCOUNT.id },
} as unknown as Props["route"];

function mockTokens(overrides: Record<string, unknown> = {}) {
  mockUseTokensData.mockReturnValue({
    data: { tokens: [xrpIouToken, xrpMptToken], pagination: {} },
    isLoading: false,
    isError: false,
    loadNext: undefined,
    refetch: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useTokensData>);
}

function renderScreen(account = XRP_ACCOUNT) {
  return render(<SelectToken navigation={navigation} route={route} />, {
    overrideInitialState: overrideWithAccounts(account),
  });
}

describe("XRP add token - select asset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetXrpEnabledTokenStandards.mockReturnValue(["iou", "mpt"]);
    mockTokens();
  });

  it("opens the review of the tapped MPT", async () => {
    const { user } = renderScreen();

    await user.press(screen.getByTestId(`xrp-token-row-${xrpMptToken.id}`));

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.XrpAddTokenReview, {
      accountId: XRP_ACCOUNT.id,
      token: xrpMptToken,
    });
  });

  it("opens the review of the tapped IOU", async () => {
    const { user } = renderScreen();

    await user.press(screen.getByTestId(`xrp-token-row-${xrpIouToken.id}`));

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.XrpAddTokenReview, {
      accountId: XRP_ACCOUNT.id,
      token: xrpIouToken,
    });
  });

  it("lists the ticker of a token, without its issuer", () => {
    renderScreen();

    expect(screen.getByText(xrpMptToken.ticker)).toBeVisible();
    expect(screen.queryByText(new RegExp(xrpMptToken.contractAddress))).toBeNull();
  });

  it("tells apart tokens sharing a name and ticker by their issuer", () => {
    mockTokens({
      data: { tokens: [xrpIouToken, sameTickerOtherIssuerToken, xrpMptToken], pagination: {} },
    });
    renderScreen();

    const iouRow = screen.getByTestId(`xrp-token-row-${xrpIouToken.id}`);
    const otherIssuerRow = screen.getByTestId(`xrp-token-row-${sameTickerOtherIssuerToken.id}`);

    expect(within(iouRow).getByText(`RLUSD · ${xrpIouToken.contractAddress}`)).toBeVisible();
    expect(within(otherIssuerRow).getByText("RLUSD · rHb9...tyTh")).toBeVisible();
    expect(screen.getByText(xrpMptToken.ticker)).toBeVisible();
  });

  it("lists the ticker alone once the account holds the other token sharing it", () => {
    mockTokens({
      data: { tokens: [xrpIouToken, sameTickerOtherIssuerToken], pagination: {} },
    });
    renderScreen(XRP_ACCOUNT_WITH_TOKEN);

    expect(screen.getByTestId(`xrp-token-row-${sameTickerOtherIssuerToken.id}`)).toBeVisible();
    expect(screen.queryByText("RLUSD · rHb9...tyTh")).toBeNull();
  });

  it("measures the no-assets sheet through a bottom sheet view", () => {
    mockGetXrpEnabledTokenStandards.mockReturnValue([]);
    renderScreen();

    expect(within(screen.getByTestId("measured-sheet-view")).getByText("Got it")).toBeVisible();
  });

  it("does not list a token the account already holds", () => {
    renderScreen(XRP_ACCOUNT_WITH_TOKEN);

    expect(screen.queryByTestId(`xrp-token-row-${xrpIouToken.id}`)).toBeNull();
    expect(screen.getByTestId(`xrp-token-row-${xrpMptToken.id}`)).toBeVisible();
  });

  it("finds a token by its name", async () => {
    const { user } = renderScreen();

    await user.type(screen.getByTestId("xrp-token-search"), "test mpt");

    expect(screen.getByTestId(`xrp-token-row-${xrpMptToken.id}`)).toBeVisible();
    expect(screen.queryByTestId(`xrp-token-row-${xrpIouToken.id}`)).toBeNull();
  });

  it("finds a token by its ticker", async () => {
    const { user } = renderScreen();

    await user.type(screen.getByTestId("xrp-token-search"), "rlusd");

    expect(screen.getByTestId(`xrp-token-row-${xrpIouToken.id}`)).toBeVisible();
    expect(screen.queryByTestId(`xrp-token-row-${xrpMptToken.id}`)).toBeNull();
  });

  it("does not find a token by its issuer", async () => {
    const { user } = renderScreen();

    await user.type(screen.getByTestId("xrp-token-search"), "rOtherIssuer");

    expect(screen.queryByTestId(`xrp-token-row-${xrpMptToken.id}`)).toBeNull();
    expect(screen.getByText("No asset found")).toBeVisible();
  });

  it("says no assets are available and closes the flow on Got it", async () => {
    mockGetXrpEnabledTokenStandards.mockReturnValue([]);
    const { user } = renderScreen();

    expect(screen.getByText("No assets available")).toBeVisible();
    expect(
      screen.getByText("There are no assets currently available to add to this account."),
    ).toBeVisible();

    await user.press(screen.getByText("Got it"));

    expect(mockPopFlow).toHaveBeenCalledTimes(1);
  });

  it("closes the flow once when the screen unmounts after Got it", async () => {
    mockGetXrpEnabledTokenStandards.mockReturnValue([]);
    const { user, unmount } = renderScreen();

    await user.press(screen.getByText("Got it"));
    unmount();

    expect(mockPopFlow).toHaveBeenCalledTimes(1);
  });

  it("keeps the flow open and the empty sheet back after the app is locked and unlocked", () => {
    mockGetXrpEnabledTokenStandards.mockReturnValue([]);
    const { store } = renderScreen();

    act(() => {
      store.dispatch(lockApp());
    });
    act(() => {
      store.dispatch(unlockApp());
    });

    expect(mockPopFlow).not.toHaveBeenCalled();
    expect(screen.getByText("No assets available")).toBeVisible();
  });

  it("keeps the flow open when refreshed data fills the list under the empty sheet", () => {
    mockTokens({ data: { tokens: [], pagination: {} } });
    const { rerender } = renderScreen();

    mockTokens();
    rerender(<SelectToken navigation={navigation} route={route} />);

    expect(mockPopFlow).not.toHaveBeenCalled();
    expect(screen.getByTestId(`xrp-token-row-${xrpMptToken.id}`)).toBeVisible();
  });

  it("keeps the flow open when the loaded list turns out empty", () => {
    mockTokens({ data: undefined, isLoading: true });
    const { rerender } = renderScreen();

    mockTokens({ data: { tokens: [], pagination: {} } });
    rerender(<SelectToken navigation={navigation} route={route} />);

    expect(screen.getByText("No assets available")).toBeVisible();
    expect(mockPopFlow).not.toHaveBeenCalled();
  });

  it("says no assets are available once the account holds every token", () => {
    mockTokens({ data: { tokens: [xrpIouToken], pagination: {} } });
    renderScreen(XRP_ACCOUNT_WITH_TOKEN);

    expect(screen.getByText("No assets available")).toBeVisible();
  });

  it("retries a failed token list", async () => {
    const refetch = jest.fn();
    mockTokens({ refetch, data: undefined, isError: true });
    const { user } = renderScreen();

    expect(screen.getByText("The token list couldn't load.")).toBeVisible();
    await user.press(screen.getByText("Retry"));

    expect(refetch).toHaveBeenCalled();
  });

  it("stops searching the next pages once a page fails", () => {
    const loadNext = jest.fn();
    mockGetXrpEnabledTokenStandards.mockReturnValue([]);
    mockTokens({ loadNext, isError: true });
    renderScreen();

    expect(screen.getByText("The token list couldn't load.")).toBeVisible();
    expect(loadNext).not.toHaveBeenCalled();
  });
});
