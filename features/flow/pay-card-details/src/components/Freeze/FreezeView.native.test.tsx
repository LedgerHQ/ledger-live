import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { CARD_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { FreezeView } from "./FreezeView";
import type { FreezeViewProps } from "../../types";

function renderFreeze(props: Partial<FreezeViewProps> = {}) {
  const onOpenConfirm = jest.fn();
  const onCloseConfirm = jest.fn();
  const onConfirm = jest.fn();

  const view = render(
    <FreezeView
      isFrozen={false}
      isUpdating={false}
      isActionDisabled={false}
      isConfirmOpen={false}
      onOpenConfirm={onOpenConfirm}
      onCloseConfirm={onCloseConfirm}
      onConfirm={onConfirm}
      {...props}
    />,
    { wrapper: I18nWrapper },
  );

  return { user: userEvent.setup(), onOpenConfirm, onCloseConfirm, onConfirm, ...view };
}

describe("FreezeView (native)", () => {
  it("renders the freeze tile on an active card", () => {
    renderFreeze();

    expect(screen.getByText(CARD_COPY.freeze)).toBeVisible();
  });

  it("renders the unfreeze tile on a frozen card", () => {
    renderFreeze({ isFrozen: true });

    expect(screen.getByText(CARD_COPY.unfreeze)).toBeVisible();
  });

  it("opens the confirmation from the tile", async () => {
    const { user, onOpenConfirm, onConfirm } = renderFreeze();

    await user.press(screen.getByText(CARD_COPY.freeze));

    expect(onOpenConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("hides the confirmation until it is opened", () => {
    renderFreeze();

    expect(screen.queryByText(CARD_COPY.freezeTitle)).toBeNull();
  });

  it("asks to confirm the unfreeze of a frozen card", () => {
    renderFreeze({ isConfirmOpen: true, isFrozen: true });

    expect(screen.getByText(CARD_COPY.unfreezeTitle)).toBeVisible();
  });

  it("disables the confirm button while the card is updating", () => {
    renderFreeze({ isConfirmOpen: true, isUpdating: true });

    expect(screen.getByTestId("freeze-confirm-action").props.disabled).toBe(true);
  });

  it("disables the tile when the action is unavailable", () => {
    renderFreeze({ isActionDisabled: true });

    expect(screen.getByText(CARD_COPY.freeze).parent?.props.disabled).toBe(true);
  });
});
