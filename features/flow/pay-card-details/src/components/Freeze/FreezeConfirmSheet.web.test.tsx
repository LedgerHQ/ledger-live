import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CARD_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { FreezeConfirmSheet } from "./FreezeConfirmSheet";
import type { FreezeConfirmSheetProps } from "../../types";

function renderSheet(props: Partial<FreezeConfirmSheetProps> = {}) {
  const onConfirm = jest.fn();
  const onClose = jest.fn();

  const view = render(
    <FreezeConfirmSheet
      isOpen
      isFrozen={false}
      isLoading={false}
      onConfirm={onConfirm}
      onClose={onClose}
      {...props}
    />,
    { wrapper: I18nWrapper },
  );

  return { onConfirm, onClose, ...view };
}

describe("FreezeConfirmSheet (web)", () => {
  it("renders nothing when closed", () => {
    expect(renderSheet({ isOpen: false }).container).toBeNull();
  });

  it("shows the freeze confirmation copy", () => {
    renderSheet();

    expect(screen.getByText(CARD_COPY.freezeTitle)).toBeVisible();
    expect(screen.getByText(CARD_COPY.freezeDescription)).toBeVisible();
    expect(screen.getByRole("button", { name: CARD_COPY.freezeConfirm })).toBeVisible();
  });

  it("shows the unfreeze confirmation copy without the freeze description", () => {
    renderSheet({ isFrozen: true });

    expect(screen.getByText(CARD_COPY.unfreezeTitle)).toBeVisible();
    expect(screen.getByRole("button", { name: CARD_COPY.unfreezeConfirm })).toBeVisible();
    expect(screen.queryByText(CARD_COPY.freezeDescription)).not.toBeInTheDocument();
  });

  it("calls onConfirm from the confirm button", async () => {
    const { onConfirm, onClose } = renderSheet();

    await userEvent.click(screen.getByRole("button", { name: CARD_COPY.freezeConfirm }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose from the go back button", async () => {
    const { onConfirm, onClose } = renderSheet();

    await userEvent.click(screen.getByRole("button", { name: CARD_COPY.goBack }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onClose from the header close button", async () => {
    const { onConfirm, onClose } = renderSheet();

    await userEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("disables both buttons while loading", () => {
    renderSheet({ isLoading: true });

    expect(screen.getByRole("button", { name: CARD_COPY.freezeConfirm })).toBeDisabled();
    expect(screen.getByRole("button", { name: CARD_COPY.goBack })).toBeDisabled();
  });
});
