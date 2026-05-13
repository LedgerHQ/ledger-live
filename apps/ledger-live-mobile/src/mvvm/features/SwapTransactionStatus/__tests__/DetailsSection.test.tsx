import React from "react";
import { Linking } from "react-native";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { getProviderIconUrl } from "@ledgerhq/live-common/icons/providers/providers";
import type { AdditionalProviderConfig } from "@ledgerhq/live-common/exchange/providers/swap";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { DetailsSection } from "../components/Details/DetailsSection";

jest.mock("@ledgerhq/native-ui/pre-ldls", () => {
  const React = jest.requireActual("react");
  const { Text } = jest.requireActual("react-native");

  return {
    CryptoIcon: jest.fn(({ ledgerId, shape }) =>
      React.createElement(Text, { testID: `crypto-icon-${ledgerId}` }, shape ?? ""),
    ),
  };
});
jest.mock("@ledgerhq/live-common/icons/providers/providers", () => ({
  getProviderIconUrl: jest.fn(
    () => 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" />',
  ),
}));

const mockedCryptoIcon = jest.mocked(CryptoIcon);
const mockedGetProviderIconUrl = jest.mocked(getProviderIconUrl);
const ethereum = getCryptoCurrencyById("ethereum");

const changellyProviderData: AdditionalProviderConfig = {
  type: "CEX",
  needsKYC: false,
  termsOfUseUrl: "https://changelly.com/terms",
  supportUrl: "https://changelly.com/support",
  mainUrl: "https://changelly.com",
  useInExchangeApp: true,
  displayName: "Changelly",
};

describe("DetailsSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  it("should render filled transaction details and open the provider website", () => {
    render(
      <DetailsSection
        feesAmount="0.001 ETH"
        receiveAccountName="Ethereum 1"
        receiveAccountCurrency={ethereum}
        provider="changelly"
        providerData={changellyProviderData}
        swapId="1234567890abcdef"
      />,
    );

    expect(screen.getByText("Network fees")).toBeVisible();
    expect(screen.getByText("0.001 ETH")).toBeVisible();
    expect(screen.getByText("Receive account")).toBeVisible();
    expect(screen.getByText("Ethereum 1")).toBeVisible();
    expect(screen.getByText("Swap ID")).toBeVisible();
    expect(screen.getByText("12345678…abcdef")).toBeVisible();

    fireEvent.press(screen.getByText("Changelly"));

    expect(Linking.openURL).toHaveBeenCalledWith("https://changelly.com");
    expect(mockedCryptoIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        ledgerId: ethereum.id,
        shape: "square",
        size: 16,
        ticker: ethereum.ticker,
      }),
      undefined,
    );
    expect(mockedGetProviderIconUrl).toHaveBeenCalledWith({
      name: "changelly",
      boxed: true,
    });
  });

  it("should render provider details without a link when provider metadata has no URL", () => {
    render(
      <DetailsSection
        provider="changelly"
        providerData={{ ...changellyProviderData, mainUrl: "" }}
        swapId="swap-1"
      />,
    );

    expect(screen.getByText("Changelly")).toBeVisible();
    fireEvent.press(screen.getByText("Changelly"));
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it("should keep the provider row hidden until provider data is available", () => {
    render(<DetailsSection swapId="swap-1" />);

    expect(screen.queryByText("Provider")).toBeNull();
  });
});
