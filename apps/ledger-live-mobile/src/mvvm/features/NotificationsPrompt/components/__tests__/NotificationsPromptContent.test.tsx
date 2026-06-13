import React from "react";
import { render, screen } from "@tests/test-renderer";
import { NotificationsPromptContent } from "../NotificationsPromptContent";

const renderContent = (props: React.ComponentProps<typeof NotificationsPromptContent>) =>
  render(<NotificationsPromptContent {...props} />);

describe("NotificationsPromptContent", () => {
  it("should render the given title and description", () => {
    renderContent({
      title: "Turn notifications on",
      description:
        "Get the latest updates on Ledger Wallet, Ledger products, the market, and personalised recommendations. Opt-out anytime in the settings",
    });

    expect(screen.getByText("Turn notifications on")).toBeOnTheScreen();
    expect(
      screen.getByText(
        "Get the latest updates on Ledger Wallet, Ledger products, the market, and personalised recommendations. Opt-out anytime in the settings",
      ),
    ).toBeOnTheScreen();
  });
});
