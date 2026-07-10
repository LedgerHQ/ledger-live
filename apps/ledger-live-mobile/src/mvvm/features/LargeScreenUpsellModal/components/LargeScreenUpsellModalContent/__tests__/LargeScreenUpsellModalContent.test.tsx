import React from "react";
import { render, screen } from "@tests/test-renderer";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalFeatureIntro,
} from "@ledgerhq/live-common/genericAwarenessModal";
import type { FeatureIntroViewModel } from "LLM/components/FeatureIntroLayout/types";
import { LargeScreenUpsellModalContent } from "..";

const content: GenericAwarenessModalFeatureIntro = {
  id: "large-screen-upsell-modal",
  layout: GenericAwarenessModalLayout.FeatureIntro,
  imageUrlLight: "https://example.com/light.png",
  imageUrlDark: "https://example.com/dark.png",
  title: "See more. Tap less. Save 10%",
  subtitle: "Enjoy a larger screen and smarter transaction review.",
  primaryButtonLabel: "Claim offer",
  primaryButtonLink: "https://www.ledger.com",
  secondaryButtonLabel: "",
  secondaryButtonLink: "",
  items: [],
  isReady: true,
};

const renderLargeScreenUpsellModalContent = (
  contentOverrides?: Partial<GenericAwarenessModalFeatureIntro>,
) => {
  const viewModel: FeatureIntroViewModel = {
    content: {
      ...content,
      ...contentOverrides,
    },
    onPrimaryPress: jest.fn(),
    onSecondaryPress: jest.fn(),
  };

  return render(
    <LargeScreenUpsellModalContent
      onClose={jest.fn()}
      onCtaPress={jest.fn()}
      viewModel={viewModel}
    />,
  );
};

describe("LargeScreenUpsellModalContent", () => {
  it("should render the primary CTA when label and link are provided", () => {
    renderLargeScreenUpsellModalContent();

    expect(screen.getByTestId("large-screen-upsell-modal-primary-button")).toBeOnTheScreen();
    expect(screen.getByText("Claim offer")).toBeOnTheScreen();
  });

  it.each([
    { primaryButtonLabel: "", primaryButtonLink: "https://www.ledger.com" },
    { primaryButtonLabel: "   ", primaryButtonLink: "https://www.ledger.com" },
    { primaryButtonLabel: "Claim offer", primaryButtonLink: "" },
    { primaryButtonLabel: "Claim offer", primaryButtonLink: "   " },
  ] as const)("should hide the primary CTA when action config is incomplete", patch => {
    renderLargeScreenUpsellModalContent(patch);

    expect(screen.queryByTestId("large-screen-upsell-modal-primary-button")).not.toBeOnTheScreen();
  });
});
