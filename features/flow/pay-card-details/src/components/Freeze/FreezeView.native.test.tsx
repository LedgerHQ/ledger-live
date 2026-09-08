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
      isBlocked={false}
      isStatusLoading={false}
      isFreezeLoading={false}
      isUnfreezeLoading={false}
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

  it("keeps the confirmation closed until isConfirmOpen is true", () => {
    renderFreeze();

    expect(screen.queryByText(CARD_COPY.freezeTitle)).toBeNull();
  });

  it("shows the unfreeze confirmation when the sheet is open", () => {
    renderFreeze({ isConfirmOpen: true, isFrozen: true });

    expect(screen.getByText(CARD_COPY.unfreezeTitle)).toBeVisible();
  });

  it("disables the confirm button while freeze is loading", () => {
    renderFreeze({ isConfirmOpen: true, isFreezeLoading: true });

    expect(screen.getByTestId("freeze-confirm-action").props.disabled).toBe(true);
  });

  it.each([
    ["the card is blocked", { isBlocked: true }],
    ["card status is loading", { isStatusLoading: true }],
    ["freeze is loading", { isFreezeLoading: true }],
    ["unfreeze is loading", { isUnfreezeLoading: true }],
  ])("disables the tile while %s", (_reason, props) => {
    renderFreeze(props);

    expect(screen.getByText(CARD_COPY.freeze).parent?.props.disabled).toBe(true);
  });
});
