import React from "react";
import { render, screen } from "@tests/test-renderer";
import { FeatureIntroContent } from "../FeatureIntroContent";
import type { FeatureIntroContent as FeatureIntroContentData } from "../../types";

const content: FeatureIntroContentData = {
  imageUrl: "https://example.com/feature-intro.png",
  title: "Connect a Ledger device",
  description: "Connect a device to unlock Ledger Wallet features.",
  primaryButtonLabel: "Connect",
  primaryButtonLink: "",
  secondaryButtonLabel: "Buy your Ledger device",
  secondaryButtonLink: "",
  items: [
    {
      icon: "HandCoins",
      title: "Full ownership",
      description: "Your private keys never leave the device.",
    },
    {
      icon: "ShieldLock",
      title: "Trade securely",
      description: "Verify transactions on a secure screen.",
    },
  ],
};

describe("FeatureIntroContent", () => {
  it("should render the feature intro content", () => {
    render(<FeatureIntroContent content={content} onClose={jest.fn()} />);

    expect(screen.getByText("Connect a Ledger device")).toBeOnTheScreen();
    expect(
      screen.getByText("Connect a device to unlock Ledger Wallet features."),
    ).toBeOnTheScreen();
    expect(screen.getByText("Full ownership")).toBeOnTheScreen();
    expect(screen.getByText("Your private keys never leave the device.")).toBeOnTheScreen();
    expect(screen.getByText("Trade securely")).toBeOnTheScreen();
    expect(screen.getByText("Verify transactions on a secure screen.")).toBeOnTheScreen();
  });

  it("should call onClose when action buttons are pressed", async () => {
    const onClose = jest.fn();
    const { user } = render(<FeatureIntroContent content={content} onClose={onClose} />);

    await user.press(screen.getByText("Connect"));
    await user.press(screen.getByText("Buy your Ledger device"));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("should render with fallback icon when icon name is invalid", () => {
    const contentWithInvalidIcon: FeatureIntroContentData = {
      ...content,
      items: [
        {
          icon: "InvalidIcon" as FeatureIntroContentData["items"][number]["icon"],
          title: "Fallback icon item",
          description: "This item still renders.",
        },
      ],
    };

    render(<FeatureIntroContent content={contentWithInvalidIcon} onClose={jest.fn()} />);

    expect(screen.getByText("Fallback icon item")).toBeOnTheScreen();
    expect(screen.getByText("This item still renders.")).toBeOnTheScreen();
  });
});
