import React from "react";
import { render, screen } from "@tests/test-renderer";
import { FeatureIntroLayout } from "../FeatureIntroLayout";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalFeatureIntro,
} from "@ledgerhq/live-common/genericAwarenessModal";
import type { FeatureIntroViewModel } from "../../screens/useGenericAwarenessModalDrawerViewModel";

const content: GenericAwarenessModalFeatureIntro = {
  id: "featureIntro",
  layout: GenericAwarenessModalLayout.FeatureIntro,
  imageUrl: "https://example.com/feature-intro.png",
  title: "Connect a Ledger device",
  subtitle: "Connect a device to unlock Ledger Wallet features.",
  primaryButtonLabel: "Connect",
  primaryButtonLink: "",
  secondaryButtonLabel: "Buy your Ledger device",
  secondaryButtonLink: "",
  items: [
    {
      icon: "HandCoins",
      title: "Full ownership",
      subtitle: "Your private keys never leave the device.",
    },
    {
      icon: "ShieldLock",
      title: "Trade securely",
      subtitle: "Verify transactions on a secure screen.",
    },
  ],
};

describe("FeatureIntroLayout", () => {
  const renderFeatureIntroLayout = (props?: {
    readonly onClose?: () => void;
    readonly onPrimaryPress?: () => void;
    readonly onSecondaryPress?: () => void;
    readonly content?: GenericAwarenessModalFeatureIntro;
  }) => {
    const viewModel: FeatureIntroViewModel = {
      content: props?.content ?? content,
      onPrimaryPress: props?.onPrimaryPress ?? jest.fn(),
      onSecondaryPress: props?.onSecondaryPress ?? jest.fn(),
    };

    return render(
      <FeatureIntroLayout onClose={props?.onClose ?? jest.fn()} viewModel={viewModel} />,
    );
  };

  it("should render the feature intro layout", () => {
    renderFeatureIntroLayout();

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
    const { user } = renderFeatureIntroLayout({ onClose });

    await user.press(screen.getByText("Connect"));
    await user.press(screen.getByText("Buy your Ledger device"));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("should render with fallback icon when icon name is invalid", () => {
    const contentWithInvalidIcon: GenericAwarenessModalFeatureIntro = {
      ...content,
      items: [
        {
          icon: "InvalidIcon",
          title: "Fallback icon item",
          subtitle: "This item still renders.",
        },
      ],
    };

    renderFeatureIntroLayout({ content: contentWithInvalidIcon });

    expect(screen.getByText("Fallback icon item")).toBeOnTheScreen();
    expect(screen.getByText("This item still renders.")).toBeOnTheScreen();
  });
});
