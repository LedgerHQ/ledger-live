import React from "react";
import { render, screen } from "tests/testSetup";
import { WalletV4TourDialog } from "../WalletV4TourDialog";

const WALLET_V4_TOUR_KEYS = {
  firstSlideTitle: "walletV4Tour.slides.portfolio.title",
  firstSlideDescription: "walletV4Tour.slides.portfolio.description",
  ctaContinue: "walletV4Tour.cta.continue",
  ctaExplore: "walletV4Tour.cta.explore",
} as const;

describe("WalletV4TourDialog", () => {
  it("should render dialog with first slide content", () => {
    const onClose = jest.fn();
    const { i18n } = render(<WalletV4TourDialog isOpen onClose={onClose} onComplete={onClose} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(i18n.t(WALLET_V4_TOUR_KEYS.firstSlideTitle))).toBeInTheDocument();
    expect(screen.getByText(i18n.t(WALLET_V4_TOUR_KEYS.firstSlideDescription))).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: i18n.t(WALLET_V4_TOUR_KEYS.ctaContinue) }),
    ).toBeInTheDocument();
  });

  it("should switch CTA from continue to explore on last slide", async () => {
    const onClose = jest.fn();
    const { user, i18n } = render(
      <WalletV4TourDialog isOpen onClose={onClose} onComplete={onClose} />,
    );
    const continueLabel = i18n.t(WALLET_V4_TOUR_KEYS.ctaContinue);
    const exploreLabel = i18n.t(WALLET_V4_TOUR_KEYS.ctaExplore);

    const continueButton = screen.getByRole("button", { name: continueLabel });
    await user.click(continueButton);
    await user.click(continueButton);

    expect(screen.getByRole("button", { name: exploreLabel })).toBeInTheDocument();
  });

  it("should call onClose when clicking explore on last slide", async () => {
    const onClose = jest.fn();
    const { user, i18n } = render(
      <WalletV4TourDialog isOpen onClose={onClose} onComplete={onClose} />,
    );
    const continueLabel = i18n.t(WALLET_V4_TOUR_KEYS.ctaContinue);
    const exploreLabel = i18n.t(WALLET_V4_TOUR_KEYS.ctaExplore);

    await user.click(screen.getByRole("button", { name: continueLabel }));
    await user.click(screen.getByRole("button", { name: continueLabel }));
    await user.click(screen.getByRole("button", { name: exploreLabel }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
