import React, { type PropsWithChildren } from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { SignedInCardApiProviders, listenToSignedInCardApi } from "../../__tests__/cardApiStore";
import { CARD_COPY, MORE_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { CardDetails } from "./CardDetails";

listenToSignedInCardApi();

function Wrapper({ children }: PropsWithChildren) {
  return (
    <SignedInCardApiProviders>
      <I18nWrapper>{children}</I18nWrapper>
    </SignedInCardApiProviders>
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

    expect(await screen.findByText(CARD_COPY.freeze)).toBeVisible();
    expect(await screen.findByLabelText(MORE_COPY.tile)).toBeVisible();
  });
});
