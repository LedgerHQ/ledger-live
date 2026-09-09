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

  it("keeps the sheet mounted but hides its content while closed", () => {
    renderSheet({ isOpen: false });

    expect(screen.getByTestId("card-details-sheet")).toBeTruthy();
    expect(screen.queryByTestId("card-details-sheet-content")).toBeNull();
  });

  it("reports its open flag to the sheet shell", () => {
    renderSheet();

    expect(screen.getByTestId("card-details-sheet").props.accessibilityState.expanded).toBe(true);
  });

  it("renders the card face, freeze and more inside the open sheet", async () => {
    renderSheet();

    expect(screen.getByTestId("card-artwork")).toBeTruthy();
    expect(await screen.findByText(CARD_COPY.freeze)).toBeTruthy();
    expect(await screen.findByLabelText(MORE_COPY.tile)).toBeTruthy();
  });

  it("closes once, whatever the number of dismissals", () => {
    const onClose = jest.fn();
    renderSheet({ onClose });

    fireEvent.press(screen.getByTestId("card-details-sheet-dismiss"));
    fireEvent.press(screen.getByTestId("card-details-sheet-dismiss"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
