import React from "react";
import { t } from "i18next";
import { render, screen } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { Explore } from "./index";

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

    expect(screen.getByText(t("myWallet.explore"))).toBeVisible();
  });

  it("should open the buy new url when clicked", async () => {
    const { user } = render(<Explore />);

    await user.click(screen.getByText(t("myWallet.explore")));

    expect(openURL).toHaveBeenCalledTimes(1);
    expect(openURL).toHaveBeenCalledWith(urls.buyNew, "button_clicked", {
      button: "explore all",
    });
  });
});
