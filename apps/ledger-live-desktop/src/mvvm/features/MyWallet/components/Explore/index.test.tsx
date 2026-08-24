import React from "react";
import { render, screen } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { Explore } from "./index";
import { MY_WALLET_TRACKING_BUTTON, MY_WALLET_TRACKING_PAGE_NAME } from "../../constants";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("~/renderer/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: (url: string) => url,
}));

describe("Explore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display the explore item", () => {
    render(<Explore />);

    expect(screen.getByText("Explore all Ledger devices")).toBeVisible();
  });

  it("should open the buy new url when clicked", async () => {
    const { user } = render(<Explore />);

    await user.click(screen.getByText("Explore all Ledger devices"));

    expect(openURL).toHaveBeenCalledTimes(1);
    expect(openURL).toHaveBeenCalledWith(urls.exploreLedgerDevices, "button_clicked", {
      button: MY_WALLET_TRACKING_BUTTON.exploreAllLedger,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
  });
});
