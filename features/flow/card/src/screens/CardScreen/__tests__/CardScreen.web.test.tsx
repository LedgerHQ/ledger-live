import React from "react";
import { render } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { CardScreen } from "../index";

function renderCardScreen() {
  return render(
    <StyleProvider colorScheme="light">
      <CardScreen />
    </StyleProvider>,
  );
}

describe("CardScreen (Web)", () => {
  it("renders the card title", () => {
    const { getByText } = renderCardScreen();

    expect(getByText("Card playground")).toBeVisible();
  });

  it("renders the card description", () => {
    const { getByText } = renderCardScreen();

    expect(getByText("Card flow scaffold by design system")).toBeVisible();
  });
});
