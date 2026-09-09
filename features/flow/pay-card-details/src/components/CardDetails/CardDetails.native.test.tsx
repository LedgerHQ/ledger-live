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
  it("shows the card face and the two preview actions", () => {
    renderCardDetails();

    expect(screen.getByTestId("card-details")).toBeTruthy();
    expect(screen.getByTestId("card-artwork")).toBeTruthy();
    expect(screen.getByTestId("card-details-fade")).toBeTruthy();
    expect(screen.getByLabelText(CARD_COPY.placeholder)).toBeTruthy();
    expect(screen.getByLabelText(CARD_COPY.details)).toBeTruthy();
  });

  it("keeps the details sheet content hidden until Details is pressed", () => {
    renderCardDetails();

    expect(screen.queryByTestId("card-details-sheet-content")).toBeNull();
  });

  it("opens the details sheet with the full card UI when Details is pressed", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByTestId("card-details-open"));

    expect(await screen.findByTestId("card-details-sheet-content")).toBeTruthy();
    expect(await screen.findByText(CARD_COPY.freeze)).toBeTruthy();
    expect(await screen.findByLabelText(MORE_COPY.tile)).toBeTruthy();
  });
});
