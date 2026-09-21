import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { CARD_COPY, I18nWrapper } from "../../../__tests__/i18nWrapper";
import { Tile } from "./Tile";
import type { FreezeViewModel } from "../../../types";

function renderFreeze(props: Partial<FreezeViewModel> = {}) {
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

  return { user: userEvent.setup(), onOpenConfirm, onClose, onConfirm, ...view };
}

describe("Tile (native)", () => {
  it("renders the freeze tile on an active card", () => {
    renderFreeze();

    expect(screen.getByText(CARD_COPY.freeze)).toBeVisible();
  });

  it("renders the unfreeze tile on a frozen card", () => {
    renderFreeze({ status: "FROZEN" });

    expect(screen.getByText(CARD_COPY.unfreeze)).toBeVisible();
  });

  it("opens the confirmation from the tile", async () => {
    const { user, onOpenConfirm, onConfirm } = renderFreeze();

    await user.press(screen.getByText(CARD_COPY.freeze));

    expect(onOpenConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("disables the tile when the action is unavailable", () => {
    renderFreeze({ isActionDisabled: true });

    expect(screen.getByText(CARD_COPY.freeze).parent?.props.disabled).toBe(true);
  });
});
