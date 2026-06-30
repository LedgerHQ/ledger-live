import React from "react";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { NotificationsPromptContent } from "../NotificationsPromptContent";
import { createNotificationsPromptFeatureFlags } from "../../testUtils";

const renderContent = (
  props: React.ComponentProps<typeof NotificationsPromptContent> = {},
  featureFlags = createNotificationsPromptFeatureFlags(),
) =>
  render(<NotificationsPromptContent {...props} />, {
    overrideInitialState: withFlagOverrides(featureFlags),
  });

describe("NotificationsPromptContent", () => {
  it("should render the new wording global push copy", () => {
    renderContent();

    expect(screen.getByText("Don't miss what matters")).toBeOnTheScreen();
    expect(
      screen.getByText(
        "Get real-time alerts on new tokens, earning opportunities, and market shifts. Opt out at any time.",
      ),
    ).toBeOnTheScreen();
  });

  it("should render transaction alerts copy for the transactions alerts prompt target", () => {
    renderContent({ promptTarget: "transactionsAlertsCategory" });

    expect(screen.getByText("Know the status of your money")).toBeOnTheScreen();
    expect(
      screen.getByText(
        "Receive real-time alerts when your crypto is sent or received. Opt out at anytime via Settings.",
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByText("Don't miss what matters")).not.toBeOnTheScreen();
  });
});
