import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { CARD_COPY, I18nWrapper } from "../../../__tests__/i18nWrapper";
import { ConfirmSheet } from "./ConfirmSheet";
import type { ConfirmSheetProps } from "../../../types";

function renderSheet(props: Partial<ConfirmSheetProps> = {}) {
  const onConfirm = jest.fn();
  const onClose = jest.fn();

  const view = render(
    <ConfirmSheet
      confirmState="idle"
      status="ACTIVE"
      onConfirm={onConfirm}
      onClose={onClose}
      {...props}
    />,
    { wrapper: I18nWrapper },
  );

  return { user: userEvent.setup(), onConfirm, onClose, ...view };
}

describe("ConfirmSheet (native)", () => {
  it("hides the sheet content when closed", () => {
    renderSheet({ confirmState: "closed" });

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
    renderSheet({ status: "FROZEN" });

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

  it("calls onClose once when going back also makes the sheet report its dismissal", async () => {
    const { user, onClose } = renderSheet();

    await user.press(screen.getByTestId("freeze-confirm-cancel"));
    await user.press(screen.getByTestId("freeze-confirm-sheet-dismiss"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose again after reopening the sheet", async () => {
    const { user, onClose, rerender } = renderSheet();
    const props = { status: "ACTIVE" as const, onConfirm: jest.fn(), onClose };

    await user.press(screen.getByTestId("freeze-confirm-cancel"));
    rerender(<ConfirmSheet {...props} confirmState="closed" />);
    rerender(<ConfirmSheet {...props} confirmState="idle" />);
    await user.press(screen.getByTestId("freeze-confirm-cancel"));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("disables both buttons while the request is in flight", () => {
    renderSheet({ confirmState: "pending" });

    expect(screen.getByTestId("freeze-confirm-action").props.disabled).toBe(true);
    expect(screen.getByTestId("freeze-confirm-cancel").props.disabled).toBe(true);
  });

  it("keeps the sheet open while the request is in flight", async () => {
    const { user, onClose } = renderSheet({ confirmState: "pending" });

    await user.press(screen.getByTestId("freeze-confirm-sheet-dismiss"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows the freeze error copy when the request failed", () => {
    renderSheet({ confirmState: "error" });

    expect(screen.getByText(CARD_COPY.freezeErrorTitle)).toBeVisible();
    expect(screen.getByText(CARD_COPY.errorDescription)).toBeVisible();
  });

  it("shows the unfreeze error copy when the request failed", () => {
    renderSheet({ confirmState: "error", status: "FROZEN" });

    expect(screen.getByText(CARD_COPY.unfreezeErrorTitle)).toBeVisible();
  });

  it("retries from the error view", async () => {
    const { user, onConfirm } = renderSheet({ confirmState: "error" });

    await user.press(screen.getByTestId("freeze-confirm-action"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("closes from the error view", async () => {
    const { user, onClose } = renderSheet({ confirmState: "error" });

    await user.press(screen.getByTestId("freeze-confirm-cancel"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
