import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { AdditionalProviderConfig } from "@ledgerhq/live-common/exchange/providers/swap";
import { render, screen } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import { DetailsSection } from "../components/Details/DetailsSection";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const mockedOpenURL = jest.mocked(openURL);
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
        provider="changelly"
        providerData={changellyProviderData}
        receiveCurrency={ethereum}
        swapId="1234567890abcdef"
      />,
    );

    expect(screen.getByText("Network fees")).toBeVisible();
    expect(screen.getByText("0.001 ETH")).toBeVisible();
    expect(screen.getByText("Receive account")).toBeVisible();
    expect(screen.getByText("Ethereum 1")).toBeVisible();
    expect(screen.getByText("12345678…abcdef")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /changelly/i }));

    expect(mockedOpenURL).toHaveBeenCalledWith(
      "https://changelly.com",
      "SwapTransactionStatus_Provider",
    );
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
});
