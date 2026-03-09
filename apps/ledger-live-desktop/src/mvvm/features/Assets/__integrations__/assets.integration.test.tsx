import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { DeviceModelId } from "@ledgerhq/devices";
import { useNavigate } from "react-router";
import { server } from "tests/server";
import Assets from "../index";
import {
  BTC_ACCOUNT,
  ETH_ACCOUNT,
  SOL_ACCOUNT,
  ARB_ACCOUNT,
  BASE_ACCOUNT,
  SCROLL_ACCOUNT,
  HEDERA_ACCOUNT,
  ETH_ACCOUNT_WITH_USDC,
} from "LLD/features/__mocks__/accounts.mock";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

const mockedUseNavigate = jest.mocked(useNavigate);

jest.mock("~/renderer/hooks/usePrice", () => ({
  usePrice: () => ({
    counterValue: null,
    counterValueCurrency: getCryptoCurrencyById("bitcoin"),
    effectiveUnit: getCryptoCurrencyById("bitcoin").units[0],
    valueNum: 100000000,
  }),
}));

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculate: () => undefined,
}));

const MANY_CRYPTO_ACCOUNTS = [
  BTC_ACCOUNT,
  ETH_ACCOUNT,
  ARB_ACCOUNT,
  BASE_ACCOUNT,
  SCROLL_ACCOUNT,
  HEDERA_ACCOUNT,
  SOL_ACCOUNT,
];

const MOCK_LAST_SEEN_DEVICE = {
  modelId: DeviceModelId.nanoX,
  deviceInfo: {},
  apps: [],
};

const initialState = {
  settings: { counterValue: "USD" },
};

const onboardedState = {
  settings: { counterValue: "USD", lastSeenDevice: MOCK_LAST_SEEN_DEVICE },
};

describe("Assets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it("should render skeleton while loading, then display sections with asset details", async () => {
    render(<Assets />, {
      initialState: { ...initialState, accounts: [BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC] },
    });

    expect(screen.queryByText("Cryptos")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Cryptos")).toBeVisible();
    });
    expect(screen.getByText("Stablecoins")).toBeVisible();

    expect(screen.getByText("Bitcoin")).toBeVisible();
    expect(screen.getByText("BTC")).toBeVisible();
    expect(screen.getByText("Ethereum")).toBeVisible();
    expect(screen.getByText("ETH")).toBeVisible();
  });

  it("should always render both sections even when no stablecoin accounts exist", async () => {
    render(<Assets />, {
      initialState: { ...initialState, accounts: [BTC_ACCOUNT] },
    });

    await waitFor(() => {
      expect(screen.getByText("Cryptos")).toBeVisible();
    });
    expect(screen.getByText("Stablecoins")).toBeVisible();
  });

  it("should not navigate when section header is clicked with few items", async () => {
    const { user } = render(<Assets />, {
      initialState: { ...initialState, accounts: [BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC] },
    });

    await waitFor(() => {
      expect(screen.getByText("Bitcoin")).toBeVisible();
    });

    await user.click(screen.getByTestId("cryptos-section-header-button"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should navigate to /assets when section header is clicked with many items", async () => {
    const { user } = render(<Assets />, {
      initialState: { ...onboardedState, accounts: MANY_CRYPTO_ACCOUNTS },
    });

    await waitFor(() => {
      expect(screen.getByText("Bitcoin")).toBeVisible();
    });

    await user.click(screen.getByTestId("cryptos-section-header-button"));
    expect(mockNavigate).toHaveBeenCalledWith("/assets");
  });
});
