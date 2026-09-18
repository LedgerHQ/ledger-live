import React, { type PropsWithChildren } from "react";
import { View } from "react-native";
import { act, render, screen, userEvent } from "@testing-library/react-native";
import {
  cardApiWrapper,
  listenToCardApi,
  revealCardDetailsHandler,
  signedInCardApiHandlers,
} from "@support/msw-features-flow-pay-card";
import { CARD_COPY, MORE_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { FLIP_MS } from "../Reveal/useRevealViewModel";
import { CardDetails } from "./CardDetails";
import type { CardVisualProps } from "../../types";

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
  onTrackEvent = jest.fn(),
  onTopUp,
}: {
  onTrackEvent?: jest.Mock;
  onTopUp?: () => void;
} = {}) {
  return {
    user: userEvent.setup(),
    onTrackEvent,
    ...render(<CardDetails onTrackEvent={onTrackEvent} onTopUp={onTopUp} />, { wrapper: Wrapper }),
  };
}

describe("CardDetails (native)", () => {
  it("should show the preview actions when the card details screen renders", () => {
    renderCardDetails({ onTopUp: jest.fn() });

    expect(screen.getByLabelText(CARD_COPY.topUp)).toBeVisible();
    expect(screen.getByLabelText(CARD_COPY.details)).toBeVisible();
  });

  it("should show no top up action when the host wires none", () => {
    renderCardDetails();

    expect(screen.queryByLabelText(CARD_COPY.topUp)).toBeNull();
    expect(screen.getByLabelText(CARD_COPY.details)).toBeVisible();
  });

  it("should open the top up from the card face", async () => {
    const onTopUp = jest.fn();
    const { user } = renderCardDetails({ onTopUp });

    await user.press(screen.getByLabelText(CARD_COPY.topUp));

    expect(onTopUp).toHaveBeenCalledTimes(1);
  });

  it("should offer the top up again at the bottom of the details sheet", async () => {
    const { user } = renderCardDetails({ onTopUp: jest.fn() });

    await user.press(screen.getByLabelText(CARD_COPY.details));

    expect(await screen.findByText(CARD_COPY.freeze)).toBeVisible();
    expect(screen.getAllByLabelText(CARD_COPY.topUp)).toHaveLength(2);
  });

  it("should list the assets the host passes inside the sheet, under the card actions", async () => {
    const user = userEvent.setup();
    render(<CardDetails onTrackEvent={jest.fn()} assets={<View testID="card-assets" />} />, {
      wrapper: Wrapper,
    });

    // The Pay tab shows the card face alone: the list belongs to the sheet the design draws.
    expect(screen.queryByTestId("card-assets")).toBeNull();

    await user.press(screen.getByLabelText(CARD_COPY.details));

    expect(await screen.findByTestId("card-assets")).toBeVisible();
  });

  it("should carry the same balance on the sheet's card face as on the tab's", async () => {
    const user = userEvent.setup();
    const cardVisual: CardVisualProps = {
      balance: 2500,
      balanceLabel: "Balance",
      formatCountervalue: (value: number) => ({
        integerPart: String(value),
        decimalPart: "00",
        currencyText: "$",
        decimalSeparator: ".",
        currencyPosition: "start",
      }),
    };
    render(<CardDetails onTrackEvent={jest.fn()} cardVisual={cardVisual} />, { wrapper: Wrapper });

    await user.press(screen.getByLabelText(CARD_COPY.details));

    // One face in the tab, one in the sheet, and the balance is the same on both.
    const amounts = await screen.findAllByTestId("card-visual-amount");
    expect(amounts).toHaveLength(2);
    expect(amounts.map(amount => amount.props.value)).toEqual([2500, 2500]);
  });

  it("should keep the details sheet content hidden when Details has not been pressed", () => {
    renderCardDetails();

    expect(screen.queryByText(CARD_COPY.freeze)).toBeNull();
  });

  it("should open the details sheet when Details is pressed", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));

    expect(screen.getByText(CARD_COPY.numbersReveal)).toBeVisible();
    expect(screen.getByText(CARD_COPY.freeze)).toBeVisible();
    expect(await screen.findByLabelText(MORE_COPY.tile)).toBeVisible();
  });

  it("should show the card numbers image after View", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText(CARD_COPY.numbersReveal));

    const image = await screen.findByLabelText(CARD_COPY.numbersImageAlt, {
      includeHiddenElements: true,
    });
    jest.useFakeTimers();
    try {
      await act(() => {
        image.props.onLoad();
      });
      act(() => {
        jest.advanceTimersByTime(FLIP_MS);
      });
    } finally {
      jest.useRealTimers();
    }

    expect(screen.getByLabelText(CARD_COPY.numbersImageAlt)).toBeVisible();
    expect(screen.getByText(CARD_COPY.numbersHide)).toBeVisible();
    expect(screen.queryByText(CARD_COPY.numbersReveal)).not.toBeOnTheScreen();

    await user.press(screen.getByText(CARD_COPY.numbersHide));

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

  it("should return to the overview when leaving More through back", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByLabelText(MORE_COPY.tile));
    await user.press(screen.getByTestId("card-details-sheet-back"));

    expect(screen.getByTestId("card-details-overview")).toBeVisible();
    expect(screen.queryByTestId("card-details-more-content")).toBeNull();
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
