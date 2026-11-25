import React from "react";
import { render, screen } from "@tests/test-renderer";
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

  it("opens the review of the tapped token", async () => {
    const { user } = renderScreen();

    await user.press(screen.getByTestId(`xrp-token-row-${xrpMptToken.id}`));

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.XrpAddTokenReview, {
      accountId: XRP_ACCOUNT.id,
      token: xrpMptToken,
    });
  });

  it("lists the ticker of a token, without its issuer", () => {
    renderScreen();

    expect(screen.getByText(xrpMptToken.ticker)).toBeVisible();
    expect(screen.queryByText(new RegExp(xrpMptToken.contractAddress))).toBeNull();
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
      screen.getByText("You've already added all assets available on XRPL for this account."),
    ).toBeVisible();
    await user.press(screen.getByText("Got it"));

    expect(mockPopFlow).toHaveBeenCalledTimes(1);
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
