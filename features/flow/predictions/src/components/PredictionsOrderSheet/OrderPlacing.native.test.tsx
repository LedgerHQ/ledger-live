import React from "react";
import { render, screen } from "@testing-library/react-native";
import { I18nWrapper, ORDER_COPY } from "../../__tests__/i18nWrapper";
import { OrderPlacing } from "./OrderPlacing";

describe("OrderPlacing", () => {
  it("shows the order being placed", () => {
    render(<OrderPlacing />, { wrapper: I18nWrapper });

    expect(screen.getByText(ORDER_COPY.placing)).toBeOnTheScreen();
  });
});
