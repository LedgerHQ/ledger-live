import React, { type PropsWithChildren } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { SignedInCardApiProviders, listenToSignedInCardApi } from "../../__tests__/cardApiStore";
import { CARD_COPY, I18nWrapper, MORE_COPY } from "../../__tests__/i18nWrapper";
import { CardDetailsSheet } from "./CardDetailsSheet";

listenToSignedInCardApi();

function Wrapper({ children }: PropsWithChildren) {
  return (
    <SignedInCardApiProviders>
      <I18nWrapper>{children}</I18nWrapper>
    </SignedInCardApiProviders>
  );
}

function renderSheet(props: Partial<React.ComponentProps<typeof CardDetailsSheet>> = {}) {
  return render(<CardDetailsSheet isOpen onClose={jest.fn()} {...props} />, {
    wrapper: Wrapper,
  });
}

describe("CardDetailsSheet (native)", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it("should keep the sheet content hidden when the sheet is closed", () => {
    renderSheet({ isOpen: false });

    expect(screen.getByTestId("card-details-sheet")).toBeVisible();
    expect(screen.queryByText(CARD_COPY.freeze)).toBeNull();
  });

  it("should report the open flag when the sheet is open", () => {
    renderSheet();

    expect(screen.getByTestId("card-details-sheet").props.accessibilityState.expanded).toBe(true);
  });

  it("should show freeze and more when the sheet is open", async () => {
    renderSheet();

    expect(await screen.findByLabelText("Visa")).toBeVisible();
    expect(await screen.findByText(CARD_COPY.freeze)).toBeVisible();
    expect(await screen.findByLabelText(MORE_COPY.tile)).toBeVisible();
  });

  it("should close once when dismiss is pressed twice", () => {
    const onClose = jest.fn();
    renderSheet({ onClose });

    fireEvent.press(screen.getByTestId("card-details-sheet-dismiss"));
    fireEvent.press(screen.getByTestId("card-details-sheet-dismiss"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
