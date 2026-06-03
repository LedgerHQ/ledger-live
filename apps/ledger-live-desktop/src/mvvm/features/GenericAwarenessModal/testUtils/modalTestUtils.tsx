import React from "react";
import type { UserEvent } from "@testing-library/user-event";
import { fireEvent, render, screen, waitFor } from "tests/testSetup";
import type { GenericAwarenessModalContentCard } from "@ledgerhq/live-common/genericAwarenessModal";
import {
  genericAwarenessModalInitialState,
  setGenericAwarenessModalContentCards,
  type GenericAwarenessModalSliceState,
} from "~/renderer/reducers/genericAwarenessModalSlice";
import type { State } from "~/renderer/reducers";
import type { AppDispatch } from "~/state-manager/configureStore";
import GenericAwarenessModalView from "../GenericAwarenessModalView";
import {
  closeGenericAwarenessModalDialog,
  openGenericAwarenessModalDialog,
} from "../genericAwarenessModalDialog";
import { genericAwarenessModalTestContentCards } from "./fixtures";

export const initialGenericAwarenessModalState: GenericAwarenessModalSliceState =
  genericAwarenessModalInitialState;

export const createGenericAwarenessModalTestState = (overrides: Partial<State> = {}): State =>
  ({
    genericAwarenessModal: initialGenericAwarenessModalState,
    settings: { dismissedContentCards: {} },
    dialogs: {},
    ...overrides,
  }) as State;

export const dispatchGenericAwarenessModalThunk = (
  store: { dispatch: unknown },
  thunk:
    | ReturnType<typeof openGenericAwarenessModalDialog>
    | ReturnType<typeof closeGenericAwarenessModalDialog>,
) => {
  (store.dispatch as AppDispatch)(thunk);
};

export const advanceCarouselSlide = async (user: UserEvent, slideTitle: string) => {
  await user.click(screen.getByTestId("generic-awareness-modal-continue-button"));

  const slideOutAnimationStart = new Event("animationstart", { bubbles: true });
  Object.defineProperty(slideOutAnimationStart, "animationName", {
    value: "slide-out-to-left",
  });
  fireEvent(screen.getByText(slideTitle), slideOutAnimationStart);
};

export const getGenericAwarenessModalHeaderCloseButton = () =>
  screen.getByLabelText("components.dialogHeader.closeAriaLabel");

export const renderOpenAwarenessModalView = (
  contentCard: GenericAwarenessModalContentCard,
  options?: { initialState?: State; onClose?: () => void },
) =>
  render(
    <GenericAwarenessModalView
      isOpen
      onClose={options?.onClose ?? jest.fn()}
      contentCard={contentCard}
    />,
    options?.initialState ? { initialState: options.initialState } : undefined,
  );

export const seedGenericAwarenessModalContentCards = (store: { dispatch: unknown }) => {
  (store.dispatch as AppDispatch)(
    setGenericAwarenessModalContentCards(genericAwarenessModalTestContentCards),
  );
};

export const openGenericAwarenessModal = (store: { dispatch: unknown }, campaignId?: string) => {
  dispatchGenericAwarenessModalThunk(
    store,
    campaignId
      ? openGenericAwarenessModalDialog({ campaignId })
      : openGenericAwarenessModalDialog(),
  );
};

export const advanceCarouselToLastSlide = async (user: UserEvent) => {
  const slideTitles = ["Ledger Flex", "Ledger Wallet clarity", "Bitcoin, secured"] as const;

  for (const title of slideTitles) {
    await advanceCarouselSlide(user, title);
  }

  await waitFor(() => {
    expect(screen.getByText("Ethereum & beyond")).toBeVisible();
    expect(screen.getByRole("button", { name: "Close" })).toBeVisible();
  });
};
