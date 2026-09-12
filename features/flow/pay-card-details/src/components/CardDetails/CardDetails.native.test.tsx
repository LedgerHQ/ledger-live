import React, { type PropsWithChildren } from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { cardApiWrapper, listenToCardApi } from "@support/msw-features-flow-pay-card";
import { CARD_COPY, MORE_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { signedInCardApiHandlers } from "./signedInCardApi";
import { CardDetails } from "./CardDetails";

listenToCardApi(signedInCardApiHandlers);

const StoreWrapper = cardApiWrapper({ signedIn: true });

function Wrapper({ children }: PropsWithChildren) {
  return (
    <StoreWrapper>
      <I18nWrapper>{children}</I18nWrapper>
    </StoreWrapper>
  );
}

function renderCardDetails() {
  return {
    user: userEvent.setup(),
    ...render(<CardDetails />, { wrapper: Wrapper }),
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

    expect(await screen.findByText(CARD_COPY.numbersReveal)).toBeVisible();
    expect(screen.getByText(CARD_COPY.freeze)).toBeVisible();
    expect(await screen.findByLabelText(MORE_COPY.tile)).toBeVisible();
  });

  it("should flip the card and show Hide when View is pressed", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText(CARD_COPY.numbersReveal));

    expect(screen.getByTestId("card-numbers-flip")).toBeVisible();
    expect(screen.getByText(CARD_COPY.numbersHide)).toBeVisible();
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
});
