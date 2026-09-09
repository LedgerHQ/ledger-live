import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  return { onConfirm, onClose, ...view };
}

describe("ConfirmSheet (web)", () => {
  it("renders nothing when closed", () => {
    renderSheet({ confirmState: "closed" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the freeze confirmation copy", () => {
    renderSheet();

    expect(screen.getByText(CARD_COPY.freezeTitle)).toBeVisible();
    expect(screen.getByText(CARD_COPY.freezeDescription)).toBeVisible();
    expect(screen.getByRole("button", { name: CARD_COPY.freezeConfirm })).toBeVisible();
  });

  it("shows the unfreeze confirmation copy without the freeze description", () => {
    renderSheet({ status: "FROZEN" });

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

  it("disables both buttons while the request is in flight", () => {
    renderSheet({ confirmState: "pending" });

    expect(screen.getByRole("button", { name: CARD_COPY.freezeConfirm })).toBeDisabled();
    expect(screen.getByRole("button", { name: CARD_COPY.goBack })).toBeDisabled();
  });

  it("keeps the sheet open while the request is in flight", async () => {
    const { onClose } = renderSheet({ confirmState: "pending" });

    await userEvent.click(screen.getByRole("button", { name: /close/i }));

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

  it("tints the dialog with the error gradient when the request failed", () => {
    renderSheet({ confirmState: "error" });

    expect(screen.getByTestId("freeze-confirm-gradient-error")).toBeInTheDocument();
    expect(screen.queryByTestId("freeze-confirm-gradient-muted")).not.toBeInTheDocument();
  });

  it("keeps the neutral gradient while the request is in flight", () => {
    renderSheet({ confirmState: "pending" });

    expect(screen.getByTestId("freeze-confirm-gradient-muted")).toBeInTheDocument();
  });

  it("retries from the error view", async () => {
    const { onConfirm } = renderSheet({ confirmState: "error" });

    await userEvent.click(screen.getByRole("button", { name: CARD_COPY.retry }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("closes from the error view", async () => {
    const { onClose } = renderSheet({ confirmState: "error" });

    await userEvent.click(screen.getByRole("button", { name: CARD_COPY.goBack }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
