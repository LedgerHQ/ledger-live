import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useReceiveNetworkLedgerIds } from "../../../hooks/useReceiveNetworkLedgerIds";
import { RobinhoodDisclaimerBanner } from "..";

jest.mock("../../../hooks/useReceiveNetworkLedgerIds");

const mockedReceive = jest.mocked(useReceiveNetworkLedgerIds);
const TEST_ID = "asset-detail-robinhood-disclaimer-banner";
const ROBINHOOD_ONLY = ["robinhood_testnet/erc20/amd_0x71178bac73cbeb415514eb542a8995b82669778d"];

const buildDistributionItem = (amount: number): DistributionItem =>
  ({
    currency: { id: "robinhood_testnet/erc20/amd", ticker: "AMD" },
    amount,
    accounts: [],
    distribution: 1,
  }) as unknown as DistributionItem;

const enableDisclaimer = () => ({
  initialState: withFlagOverrides({ llRobinhoodDisclaimer: { enabled: true } }),
});

describe("RobinhoodDisclaimerBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedReceive.mockReturnValue(ROBINHOOD_ONLY);
  });

  it("shows the banner when the flag is on, balance is positive and the asset is Robinhood-exclusive", () => {
    render(
      <RobinhoodDisclaimerBanner distributionItem={buildDistributionItem(5)} />,
      enableDisclaimer(),
    );

    expect(screen.getByTestId(TEST_ID)).toBeVisible();
    expect(
      screen.getByText("Total balance does not include dividends or stock splits."),
    ).toBeVisible();
  });

  it("hides the banner when the balance is zero", () => {
    render(
      <RobinhoodDisclaimerBanner distributionItem={buildDistributionItem(0)} />,
      enableDisclaimer(),
    );

    expect(screen.queryByTestId(TEST_ID)).toBeNull();
  });

  it("hides the banner for a multi-network asset that also lives on Robinhood", () => {
    mockedReceive.mockReturnValue([
      "ethereum/erc20/weth_0x0bd7d308f8e1639fab988df18a8011f41eacad73",
      "robinhood/erc20/weth_0x0bd7d308f8e1639fab988df18a8011f41eacad73",
    ]);

    render(
      <RobinhoodDisclaimerBanner distributionItem={buildDistributionItem(5)} />,
      enableDisclaimer(),
    );

    expect(screen.queryByTestId(TEST_ID)).toBeNull();
  });

  it("hides the banner when the flag is off", () => {
    render(<RobinhoodDisclaimerBanner distributionItem={buildDistributionItem(5)} />);

    expect(screen.queryByTestId(TEST_ID)).toBeNull();
  });
});
