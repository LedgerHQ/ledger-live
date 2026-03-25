import React from "react";

import { render, screen } from "tests/testSetup";
import {
  CONTENT_BANNER_ACTION_CARD_CLOSE_LABEL,
  ContentBannerActionCard,
} from "../index";

describe("ContentBannerActionCard", () => {
  const defaultHandlers = {
    onClose: jest.fn(),
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render title and description in content banner layout when image_background is absent", () => {
    render(
      <ContentBannerActionCard
        title="Action title"
        description="Action body"
        {...defaultHandlers}
      />,
    );

    expect(screen.getByText("Action title")).toBeVisible();
    expect(screen.getByText("Action body")).toBeVisible();
  });

  it("should call onClick when the main button is activated without image_background", async () => {
    const { user } = render(
      <ContentBannerActionCard title="Tap me" description="Desc" {...defaultHandlers} />,
    );

    await user.click(screen.getByRole("button", { name: /tap me/i }));

    expect(defaultHandlers.onClick).toHaveBeenCalledTimes(1);
    expect(defaultHandlers.onClose).not.toHaveBeenCalled();
  });

  it("should call onClose when the stroked close control is used without image_background", async () => {
    const { user } = render(
      <ContentBannerActionCard title="Tap me" description="Desc" {...defaultHandlers} />,
    );

    await user.click(
      screen.getByRole("button", { name: CONTENT_BANNER_ACTION_CARD_CLOSE_LABEL }),
    );

    expect(defaultHandlers.onClose).toHaveBeenCalledTimes(1);
  });

  it("should render MediaBanner with image when image_background is set", () => {
    const imageUrl = "https://example.com/banner.png";
    const { container } = render(
      <ContentBannerActionCard
        title="Media title"
        description="Media desc"
        image_background={imageUrl}
        {...defaultHandlers}
      />,
    );

    expect(container.querySelector("img")).toHaveAttribute("src", imageUrl);
    expect(screen.getByText("Media title")).toBeVisible();
    expect(screen.getByText("Media desc")).toBeVisible();
  });

  it("should call onClick when the MediaBanner area is pressed", async () => {
    const { user } = render(
      <ContentBannerActionCard
        title="Banner CTA"
        description="More text"
        image_background="https://example.com/x.png"
        {...defaultHandlers}
      />,
    );

    await user.click(screen.getByText("Banner CTA"));

    expect(defaultHandlers.onClick).toHaveBeenCalledTimes(1);
  });

  it("should call onClose from MediaBanner without triggering onClick", async () => {
    const { user } = render(
      <ContentBannerActionCard
        title="Banner CTA"
        description="More text"
        image_background="https://example.com/x.png"
        {...defaultHandlers}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: CONTENT_BANNER_ACTION_CARD_CLOSE_LABEL }),
    );

    expect(defaultHandlers.onClose).toHaveBeenCalledTimes(1);
    expect(defaultHandlers.onClick).not.toHaveBeenCalled();
  });
});
