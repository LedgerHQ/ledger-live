import { t } from "i18next";
import React from "react";
import { render, screen } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { ActionsList } from "..";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

const mockTrack = jest.mocked(track);

describe("ActionsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the list with the help action", () => {
    render(<ActionsList />);

    expect(screen.getByTestId("my-wallet-actions-list")).toBeVisible();
    expect(screen.getByRole("button", { name: t("myWallet.actionsList.help") })).toBeVisible();
  });

  it("should navigate to the help settings and track the click when the help action is pressed", async () => {
    const { user } = render(<ActionsList />, { initialRoute: "/my-wallet" });

    await user.click(screen.getByRole("button", { name: t("myWallet.actionsList.help") }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/settings/help");
    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "Help",
      page: "/my-wallet",
      entry: "my_wallet_actions_list",
    });
  });
});
