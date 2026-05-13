import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { AdditionalProviderConfig } from "@ledgerhq/live-common/exchange/providers/swap";
import { render, screen } from "tests/testSetup";
import ProviderIcon from "~/renderer/components/ProviderIcon";
import { openURL } from "~/renderer/linking";
import { DetailsSection } from "../components/Details/DetailsSection";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));
jest.mock("~/renderer/components/ProviderIcon", () => ({
  __esModule: true,
  default: jest.fn(({ boxed, name }) => (
    <span data-testid={`provider-icon-${name}`} data-boxed={boxed ?? true} />
  )),
}));
jest.mock("@ledgerhq/crypto-icons", () => {
  const React = jest.requireActual("react");

  return {
    CryptoIcon: jest.fn(props =>
      React.createElement("span", {
        "data-testid": `crypto-icon-${props.ledgerId}`,
        "data-shape": props.shape,
      }),
    ),
  };
});

const mockedOpenURL = jest.mocked(openURL);
const mockedCryptoIcon = jest.mocked(CryptoIcon);
const mockedProviderIcon = jest.mocked(ProviderIcon);
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
  });

  it("should render filled transaction details and open the provider website", async () => {
    const { user } = render(
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
    expect(screen.getByTestId("crypto-icon-ethereum")).toHaveAttribute("data-shape", "square");
    expect(screen.getByTestId("provider-icon-changelly")).toHaveAttribute("data-boxed", "true");
    expect(screen.getByText("12345678…abcdef")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /changelly/i }));

    expect(mockedOpenURL).toHaveBeenCalledWith(
      "https://changelly.com",
      "SwapTransactionStatus_Provider",
    );
    expect(mockedCryptoIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        ledgerId: ethereum.id,
        shape: "square",
        size: 16,
        ticker: ethereum.ticker,
      }),
      undefined,
    );
    expect(mockedProviderIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "changelly",
        size: "XXS",
      }),
      undefined,
    );
    expect(mockedProviderIcon.mock.calls[0]?.[0]).not.toHaveProperty("boxed");
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
    expect(screen.queryByRole("button", { name: /changelly/i })).not.toBeInTheDocument();
  });

  it("should keep the provider row hidden until provider data is available", () => {
    render(<DetailsSection swapId="swap-1" />);

    expect(screen.queryByText("Provider")).not.toBeInTheDocument();
  });

  it("should keep detail labels on one line while values are loading", () => {
    render(<DetailsSection swapId="swap-1" />);

    expect(screen.getByText("Network fees")).toHaveClass("whitespace-nowrap");
    expect(screen.getByText("Receive account")).toHaveClass("whitespace-nowrap");
    expect(screen.getByText("Swap ID")).toHaveClass("whitespace-nowrap");
  });
});
