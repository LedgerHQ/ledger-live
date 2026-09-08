import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
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

  return { user: userEvent.setup(), onConfirm, onClose, ...view };
}

describe("FreezeConfirmSheet (native)", () => {
  it("hides the sheet content when closed", () => {
    renderSheet({ isOpen: false });

    expect(screen.getByTestId("freeze-confirm-sheet").props.accessibilityState.expanded).toBe(
      false,
    );
    expect(screen.queryByTestId("freeze-confirm-sheet-content")).toBeNull();
  });

  it("shows the freeze confirmation copy", () => {
    renderSheet();

    expect(screen.getByText(CARD_COPY.freezeTitle)).toBeVisible();
    expect(screen.getByText(CARD_COPY.freezeDescription)).toBeVisible();
    expect(screen.getByText(CARD_COPY.freezeConfirm)).toBeVisible();
  });

  it("shows the unfreeze confirmation copy without the freeze description", () => {
    renderSheet({ isFrozen: true });

    expect(screen.getByText(CARD_COPY.unfreezeTitle)).toBeVisible();
    expect(screen.getByText(CARD_COPY.unfreezeConfirm)).toBeVisible();
    expect(screen.queryByText(CARD_COPY.freezeDescription)).toBeNull();
  });

  it("calls onConfirm from the confirm button", async () => {
    const { user, onConfirm, onClose } = renderSheet();

    await user.press(screen.getByTestId("freeze-confirm-action"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose from the go back button", async () => {
    const { user, onConfirm, onClose } = renderSheet();

    await user.press(screen.getByTestId("freeze-confirm-cancel"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onClose from the sheet dismiss control", async () => {
    const { user, onClose } = renderSheet();

    await user.press(screen.getByTestId("freeze-confirm-sheet-dismiss"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose only once when back and dismiss both fire", async () => {
    // Going back closes the sheet, which then reports its own dismissal: closing twice would
    // also pop the screen underneath.
    const { user, onClose } = renderSheet();

    await user.press(screen.getByTestId("freeze-confirm-cancel"));
    await user.press(screen.getByTestId("freeze-confirm-sheet-dismiss"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose again after reopening the sheet", async () => {
    const { user, onClose, rerender } = renderSheet();
    const props = { isFrozen: false, isLoading: false, onConfirm: jest.fn(), onClose };

    await user.press(screen.getByTestId("freeze-confirm-cancel"));
    rerender(<FreezeConfirmSheet {...props} isOpen={false} />);
    rerender(<FreezeConfirmSheet {...props} isOpen />);
    await user.press(screen.getByTestId("freeze-confirm-cancel"));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("disables both buttons while loading", () => {
    renderSheet({ isLoading: true });

    expect(screen.getByTestId("freeze-confirm-action").props.disabled).toBe(true);
    expect(screen.getByTestId("freeze-confirm-cancel").props.disabled).toBe(true);
  });
});
