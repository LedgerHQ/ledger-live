import React from "react";
import { render, screen } from "@tests/test-renderer";
import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalFeatureIntro,
} from "@ledgerhq/live-common/genericAwarenessModal";
import type { FeatureIntroViewModel } from "LLM/components/FeatureIntroLayout/types";
import { LargeScreenUpsellModalDrawer } from "..";

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

const viewModel: FeatureIntroViewModel = {
  content,
  onPrimaryPress: jest.fn(),
  onSecondaryPress: jest.fn(),
};

function renderLargeScreenUpsellModalDrawer(isOpen: boolean) {
  return render(
    <LargeScreenUpsellModalDrawer
      isOpen={isOpen}
      onClose={jest.fn()}
      onCloseFromCta={jest.fn()}
      featureIntroViewModel={viewModel}
      bottomInset={0}
    />,
  );
}

describe("LargeScreenUpsellModalDrawer", () => {
  it("should not render drawer content before it is opened", () => {
    renderLargeScreenUpsellModalDrawer(false);

    expect(screen.queryByTestId("large-screen-upsell-modal-drawer")).not.toBeOnTheScreen();
  });

  it("should render drawer content when opened", () => {
    renderLargeScreenUpsellModalDrawer(true);

    expect(screen.getByTestId("large-screen-upsell-modal-drawer")).toBeOnTheScreen();
  });
});
