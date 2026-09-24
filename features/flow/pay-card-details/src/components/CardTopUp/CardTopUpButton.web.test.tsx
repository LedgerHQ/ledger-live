import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CARD_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { CardTopUpButton } from "./CardTopUpButton.web";

describe("CardTopUpButton (web)", () => {
  afterEach(cleanup);

  it("opens the top up when clicked", () => {
    const onTopUp = jest.fn();

    render(<CardTopUpButton onTopUp={onTopUp} />, { wrapper: I18nWrapper });
    fireEvent.click(screen.getByRole("button", { name: CARD_COPY.topUp }));

    expect(onTopUp).toHaveBeenCalledTimes(1);
  });

  it("shows nothing when the host wires no top up", () => {
    render(<CardTopUpButton />, { wrapper: I18nWrapper });

    expect(screen.queryByRole("button", { name: CARD_COPY.topUp })).not.toBeInTheDocument();
  });
});
