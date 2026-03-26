import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ContentCardsType } from "~/dynamicContent/types";
import { ContentBannerActionCard } from "./index";

const IMAGE_BG_URL = "https://example.com/banner.png";

type Variant = "icon" | "image";

function setupContentBannerActionCard(variant: Variant) {
  const id = "test-card";
  const actions = {
    onView: jest.fn(),
    onClick: jest.fn(),
    onDismiss: jest.fn(),
  };

  const base = {
    type: ContentCardsType.action,
    id,
    createdAt: 1,
    viewed: false,
    title: "Promo title",
    description: "Promo body",
    metadata: { id, actions },
  };

  const props =
    variant === "icon"
      ? { ...base, icon: "Plus" as const }
      : { ...base, image_background: IMAGE_BG_URL };

  return { props, actions };
}

describe("ContentBannerActionCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("when Braze sends `icon` only (no image_background): ContentBanner + Spot, view/CTA/dismiss", async () => {
    const { props, actions } = setupContentBannerActionCard("icon");
    const { user } = render(<ContentBannerActionCard {...props} />);

    expect(actions.onView).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Promo title")).toBeVisible();
    expect(screen.getByText("Promo body")).toBeVisible();

    await user.press(screen.getByText("Promo title"));
    expect(actions.onClick).toHaveBeenCalledTimes(1);

    await user.press(screen.getByTestId("content-banner-close-button"));
    expect(actions.onDismiss).toHaveBeenCalledTimes(1);
  });

  it("when Braze sends `image_background`: MediaBanner, close must not fire CTA", async () => {
    const { props, actions } = setupContentBannerActionCard("image");
    const { user } = render(<ContentBannerActionCard {...props} />);

    expect(actions.onView).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Promo title")).toBeVisible();
    expect(screen.getByText("Promo body")).toBeVisible();

    await user.press(screen.getByTestId("media-banner-close-button"));
    expect(actions.onDismiss).toHaveBeenCalledTimes(1);
    expect(actions.onClick).not.toHaveBeenCalled();

    await user.press(screen.getByText("Promo title"));
    expect(actions.onClick).toHaveBeenCalledTimes(1);
  });
});
