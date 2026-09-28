import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { CARD_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { CardTopUpButton } from "./CardTopUpButton.native";

describe("CardTopUpButton (native)", () => {
  afterEach(cleanup);

  it("opens the top up when pressed", () => {
    const onTopUp = jest.fn();

    render(<CardTopUpButton onTopUp={onTopUp} />, { wrapper: I18nWrapper });
    fireEvent.press(screen.getByLabelText(CARD_COPY.topUp));

    expect(onTopUp).toHaveBeenCalledTimes(1);
  });

  it("shows nothing when the host wires no top up", () => {
    render(<CardTopUpButton />, { wrapper: I18nWrapper });

    expect(screen.queryByLabelText(CARD_COPY.topUp)).toBeNull();
  });
});
