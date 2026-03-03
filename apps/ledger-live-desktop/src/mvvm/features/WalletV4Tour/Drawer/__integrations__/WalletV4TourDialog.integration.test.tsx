import React from "react";
import { render, screen } from "tests/testSetup";
import { WalletV4TourDialog } from "../WalletV4TourDialog";

const SLIDES = [
  {
    title: "Swap effortlessly",
    description: "Adapt your portfolio allocation anytime with the security of your Ledger device",
  },
  {
    title: "Everything in its right place",
    description:
      "My Ledger & Discover are now at the top. Swap & Card have moved to the sidebar for faster access.",
  },
  {
    title: "Actions at market speed",
    description: "Spot market trends with the new banner and trade instantly.",
  },
] as const;

describe("WalletV4TourDialog", () => {
  it("should render dialog with first slide content", () => {
    const onClose = jest.fn();
    render(<WalletV4TourDialog isOpen onClose={onClose} onComplete={onClose} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(SLIDES[0].title)).toBeInTheDocument();
    expect(screen.getByText(SLIDES[0].description)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });

  it("should switch CTA from continue to explore on last slide", async () => {
    const onClose = jest.fn();
    const { user } = render(<WalletV4TourDialog isOpen onClose={onClose} onComplete={onClose} />);

    for (let index = 0; index < SLIDES.length - 1; index++) {
      await user.click(screen.getByRole("button", { name: "Continue" }));
    }

    expect(screen.getByRole("button", { name: "Explore my new portfolio" })).toBeInTheDocument();
  });

  it("should call onClose when clicking explore on last slide", async () => {
    const onClose = jest.fn();
    const { user } = render(<WalletV4TourDialog isOpen onClose={onClose} onComplete={onClose} />);

    for (let index = 0; index < SLIDES.length - 1; index++) {
      await user.click(screen.getByRole("button", { name: "Continue" }));
    }
    await user.click(screen.getByRole("button", { name: "Explore my new portfolio" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
