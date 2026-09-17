import React, { type PropsWithChildren } from "react";
import { act, render, screen, userEvent } from "@testing-library/react-native";
import {
  cardApiWrapper,
  listenToCardApi,
  revealCardDetailsHandler,
  signedInCardApiHandlers,
} from "@support/msw-features-flow-pay-card";
import { CARD_COPY, MORE_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { CardDetails } from "./CardDetails";

listenToCardApi([...signedInCardApiHandlers, revealCardDetailsHandler]);

const StoreWrapper = cardApiWrapper({ signedIn: true });

function Wrapper({ children }: PropsWithChildren) {
  return (
    <StoreWrapper>
      <I18nWrapper>{children}</I18nWrapper>
    </StoreWrapper>
  );
}

function renderCardDetails({
  unlock,
  onTrackEvent = jest.fn(),
}: {
  unlock?: () => Promise<boolean>;
  onTrackEvent?: jest.Mock;
} = {}) {
  return {
    user: userEvent.setup(),
    onTrackEvent,
    ...render(<CardDetails unlock={unlock} onTrackEvent={onTrackEvent} />, { wrapper: Wrapper }),
  };
}

describe("CardDetails (native)", () => {
  it("should show the preview actions when the card details screen renders", () => {
    renderCardDetails();

    expect(screen.getByLabelText(CARD_COPY.placeholder)).toBeVisible();
    expect(screen.getByLabelText(CARD_COPY.details)).toBeVisible();
  });

  it("should keep the placeholder action disabled when the card preview is shown", () => {
    renderCardDetails();

    expect(screen.getByLabelText(CARD_COPY.placeholder).props.disabled).toBe(true);
  });

  it("should keep the details sheet content hidden when Details has not been pressed", () => {
    renderCardDetails();

    expect(screen.queryByText(CARD_COPY.freeze)).toBeNull();
  });

  it("should open the details sheet when Details is pressed", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));

    expect(screen.queryByText(CARD_COPY.numbersReveal)).not.toBeOnTheScreen();
    expect(screen.getByText(CARD_COPY.freeze)).toBeVisible();
    expect(await screen.findByLabelText(MORE_COPY.tile)).toBeVisible();
  });

  it("should show the card numbers image after View when unlock succeeds", async () => {
    const { user } = renderCardDetails({ unlock: () => Promise.resolve(true) });

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText(CARD_COPY.numbersReveal));

    const image = await screen.findByLabelText(CARD_COPY.numbersImageAlt, {
      includeHiddenElements: true,
    });
    await act(() => {
      image.props.onLoad();
    });

    expect(screen.getByLabelText(CARD_COPY.numbersImageAlt)).toBeVisible();
    expect(await screen.findByText(CARD_COPY.numbersHide, {}, { timeout: 1500 })).toBeVisible();
    expect(screen.queryByText(CARD_COPY.numbersReveal)).not.toBeOnTheScreen();

    await user.press(screen.getByText(CARD_COPY.numbersHide));

    expect(screen.queryByLabelText(CARD_COPY.numbersImageAlt)).not.toBeOnTheScreen();
    expect(screen.getByText(CARD_COPY.numbersReveal)).toBeVisible();
  });

  it("should keep the card face when unlock is cancelled", async () => {
    const { user } = renderCardDetails({ unlock: () => Promise.resolve(false) });

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText(CARD_COPY.numbersReveal));

    expect(screen.queryByLabelText(CARD_COPY.numbersImageAlt)).not.toBeOnTheScreen();
    expect(screen.getByText(CARD_COPY.numbersReveal)).toBeVisible();
  });

  it("should navigate to More without opening another sheet", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByLabelText(MORE_COPY.tile));

    expect(screen.getByText(MORE_COPY.rows.managePin)).toBeVisible();
    expect(screen.getByTestId("card-details-more-content")).toBeVisible();
  });

  it("should navigate to freeze confirmation without opening another sheet", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(screen.getByText(CARD_COPY.freeze));

    expect(screen.getByText(CARD_COPY.freezeTitle)).toBeVisible();
    expect(screen.getByTestId("card-details-freeze-content")).toBeVisible();
  });

  it("should return to the overview when the freeze confirmation is cancelled", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(screen.getByText(CARD_COPY.freeze));
    await user.press(screen.getByTestId("freeze-confirm-cancel"));

    expect(screen.getByTestId("card-details-overview")).toBeVisible();
    expect(screen.queryByTestId("card-details-freeze-content")).toBeNull();
  });

  it("should open the selected transaction in the same sheet and track the click", async () => {
    const { user, onTrackEvent } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText("NETFLIX.COM"));

    expect(screen.getByTestId("card-details-transaction-content")).toBeVisible();
    expect(onTrackEvent).toHaveBeenCalledWith("transaction_clicked", {
      category: "card",
      transaction: "out",
      page: "Pay",
      cardFundSourceAsset: "USDC",
    });
  });

  it("should return to the overview when leaving transaction details through back", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText("NETFLIX.COM"));
    await user.press(screen.getByTestId("card-details-sheet-back"));

    expect(screen.getByTestId("card-details-overview")).toBeVisible();
    expect(screen.queryByTestId("card-details-transaction-content")).toBeNull();
  });

  it("should reopen on the overview after transaction details are dismissed", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText("NETFLIX.COM"));
    await user.press(screen.getByTestId("card-details-sheet-dismiss"));
    await user.press(screen.getByLabelText(CARD_COPY.details));

    expect(screen.getByTestId("card-details-overview")).toBeVisible();
    expect(screen.queryByTestId("card-details-transaction-content")).toBeNull();
  });
});
