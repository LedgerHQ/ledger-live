import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CARD_COPY, I18nWrapper } from "../../../__tests__/i18nWrapper";
import { Tile } from "./Tile";
import type { TileProps } from "../../../types";

function renderFreeze(props: Partial<TileProps> = {}) {
  const onOpenConfirm = jest.fn();
  const onClose = jest.fn();
  const onConfirm = jest.fn();

  const view = render(
    <Tile
      status="ACTIVE"
      isActionDisabled={false}
      confirmState="closed"
      onOpenConfirm={onOpenConfirm}
      onClose={onClose}
      onConfirm={onConfirm}
      {...props}
    />,
    { wrapper: I18nWrapper },
  );

  return { onOpenConfirm, onClose, onConfirm, ...view };
}

describe("Tile (web)", () => {
  it("renders the freeze tile on an active card", () => {
    renderFreeze();

    expect(screen.getByRole("button", { name: CARD_COPY.freeze })).toBeVisible();
  });

  it("renders the unfreeze tile on a frozen card", () => {
    renderFreeze({ status: "FROZEN" });

    expect(screen.getByRole("button", { name: CARD_COPY.unfreeze })).toBeVisible();
  });

  it("opens the confirmation from the tile", async () => {
    const { onOpenConfirm, onConfirm } = renderFreeze();

    await userEvent.click(screen.getByRole("button", { name: CARD_COPY.freeze }));

    expect(onOpenConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("hides the confirmation while it is closed", () => {
    renderFreeze();

    expect(screen.queryByText(CARD_COPY.freezeTitle)).not.toBeInTheDocument();
  });

  it("asks to confirm the unfreeze of a frozen card", () => {
    renderFreeze({ confirmState: "idle", status: "FROZEN" });

    expect(screen.getByText(CARD_COPY.unfreezeTitle)).toBeVisible();
  });

  it("disables the confirm button while the request is in flight", () => {
    renderFreeze({ confirmState: "pending" });

    expect(screen.getByRole("button", { name: CARD_COPY.freezeConfirm })).toBeDisabled();
  });

  it("reports a failed freeze inside the confirmation", () => {
    renderFreeze({ confirmState: "error" });

    expect(screen.getByText(CARD_COPY.freezeErrorTitle)).toBeVisible();
    expect(screen.getByText(CARD_COPY.errorDescription)).toBeVisible();
  });

  it("retries from the error state", async () => {
    const { onConfirm } = renderFreeze({ confirmState: "error" });

    await userEvent.click(screen.getByRole("button", { name: CARD_COPY.retry }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables the tile when the action is unavailable", () => {
    renderFreeze({ isActionDisabled: true });

    expect(screen.getByRole("button", { name: CARD_COPY.freeze })).toBeDisabled();
  });
});
