import React from "react";
import { render, screen } from "@tests/test-renderer";
import { WhatsNewScreen } from ".";

const setup = (notes: string | null = "## Ledger Recover\n\nAn **optional** service.") => {
  const onStart = jest.fn();
  const onClose = jest.fn();
  const utils = render(
    <WhatsNewScreen version="5.4.3" notes={notes} onStart={onStart} onClose={onClose} />,
  );
  return { ...utils, onStart, onClose };
};

describe("WhatsNewScreen", () => {
  it("shows the product name, the version, the banner and the title", () => {
    setup();

    expect(screen.getByText("LedgerOS™")).toBeVisible();
    expect(screen.getByText("Version 5.4.3")).toBeVisible();
    expect(screen.getByText(/Ensure your 24 words Secret Recovery Phrase/)).toBeVisible();
    expect(screen.getByText("What’s in this OS update?")).toBeVisible();
  });

  it("renders the notes as markdown", () => {
    setup();

    expect(screen.getByText("Ledger Recover")).toBeVisible();
    expect(screen.getByText("optional")).toBeVisible();
    expect(screen.queryByText(/\*\*optional\*\*/)).toBeNull();
  });

  it("renders without notes", () => {
    setup(null);

    expect(screen.getByText("What’s in this OS update?")).toBeVisible();
  });

  it("calls onStart when pressing Start update", async () => {
    const { user, onStart } = setup();

    await user.press(screen.getByText("Start update"));

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when pressing back", async () => {
    const { user, onClose } = setup();

    await user.press(screen.getByTestId("os-update-whats-new-back-button"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
