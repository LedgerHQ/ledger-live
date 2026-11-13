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
  XRP_IOU_TOKEN_ACCOUNT,
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

const navigation = { navigate: mockNavigate } as unknown as Props["navigation"];
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

describe("XRP add token - select token", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetXrpEnabledTokenStandards.mockReturnValue(["iou", "mpt"]);
    mockTokens();
  });

  it("opens the review of a token the account doesn't hold", async () => {
    const { user } = renderScreen();

    await user.press(screen.getByTestId(`xrp-token-row-${xrpMptToken.id}`));

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.XrpAddTokenReview, {
      accountId: XRP_ACCOUNT.id,
      token: xrpMptToken,
    });
  });

  it("marks a held token and opens its token page from the warning", async () => {
    const { user } = renderScreen(XRP_ACCOUNT_WITH_TOKEN);

    expect(screen.getByText("Already added")).toBeVisible();
    await user.press(screen.getByTestId(`xrp-token-row-${xrpIouToken.id}`));

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByTestId("xrp-token-already-added")).toBeVisible();

    await user.press(screen.getByText("Open token page"));

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.Account, {
      accountId: XRP_IOU_TOKEN_ACCOUNT.id,
      parentId: XRP_ACCOUNT.id,
    });
  });

  it("finds a token by its issuer", async () => {
    const { user } = renderScreen();

    await user.type(screen.getByTestId("xrp-token-search"), "rOtherIssuer");

    expect(screen.getByTestId(`xrp-token-row-${xrpMptToken.id}`)).toBeVisible();
    expect(screen.queryByTestId(`xrp-token-row-${xrpIouToken.id}`)).toBeNull();
  });

  it("finds a token by its ticker", async () => {
    const { user } = renderScreen();

    await user.type(screen.getByTestId("xrp-token-search"), "rlusd");

    expect(screen.getByTestId(`xrp-token-row-${xrpIouToken.id}`)).toBeVisible();
    expect(screen.queryByTestId(`xrp-token-row-${xrpMptToken.id}`)).toBeNull();
  });

  it("shows the empty state when no token is available", () => {
    mockGetXrpEnabledTokenStandards.mockReturnValue([]);
    renderScreen();

    expect(screen.getByText("No token is available for this account.")).toBeVisible();
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
