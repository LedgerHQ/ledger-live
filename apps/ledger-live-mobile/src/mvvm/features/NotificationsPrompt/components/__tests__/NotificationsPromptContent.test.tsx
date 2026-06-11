import React from "react";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { NotificationsPromptContent } from "../NotificationsPromptContent";
import { AB_TESTING_VARIANTS } from "../../types/variants";
import { createNotificationsPromptFeatureFlags } from "../../testUtils";

const renderContent = (
  props: React.ComponentProps<typeof NotificationsPromptContent> = {},
  featureFlags = createNotificationsPromptFeatureFlags(),
) =>
  render(<NotificationsPromptContent {...props} />, {
    overrideInitialState: withFlagOverrides(featureFlags),
  });

describe("NotificationsPromptContent", () => {
  it("should render variant A global push copy when the wording flag uses variant A", () => {
    renderContent({}, createNotificationsPromptFeatureFlags({ variant: AB_TESTING_VARIANTS.A }));

    expect(screen.getByText("Turn notifications on")).toBeOnTheScreen();
    expect(
      screen.getByText(
        "Get the latest updates on Ledger Wallet, Ledger products, the market, and personalised recommendations. Opt-out anytime in the settings",
      ),
    ).toBeOnTheScreen();
  });

  it("should render variant B global push copy when the wording flag uses variant B", () => {
    renderContent({}, createNotificationsPromptFeatureFlags({ variant: AB_TESTING_VARIANTS.B }));

    expect(screen.getByText("Don't miss what matters")).toBeOnTheScreen();
    expect(
      screen.getByText(
        "Get real-time alerts on new tokens, earning opportunities, and market shifts. Opt out at any time.",
      ),
    ).toBeOnTheScreen();
  });

  it("should render default global push copy when the wording feature flag is disabled", () => {
    renderContent(
      {},
      {
        ...createNotificationsPromptFeatureFlags({ variant: AB_TESTING_VARIANTS.B }),
        lwmNewWordingOptInNotificationsDrawer: {
          enabled: false,
          params: { variant: AB_TESTING_VARIANTS.B },
        },
      },
    );

    expect(screen.getByText("Turn notifications on")).toBeOnTheScreen();
    expect(screen.queryByText("Don't miss what matters")).not.toBeOnTheScreen();
  });

  it("should render transaction alerts copy regardless of wording variant", () => {
    renderContent(
      { promptTarget: "transactionsAlertsCategory" },
      createNotificationsPromptFeatureFlags({ variant: AB_TESTING_VARIANTS.B }),
    );

    expect(screen.getByText("Know the status of your money")).toBeOnTheScreen();
    expect(
      screen.getByText(
        "Receive real-time alerts when your crypto is sent or received. Opt out at anytime via Settings.",
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByText("Don't miss what matters")).not.toBeOnTheScreen();
  });
});
