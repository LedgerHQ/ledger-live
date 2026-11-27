import React from "react";
import { render, screen } from "@testing-library/react-native";
import { I18nWrapper, ORDER_COPY, SALE_COPY } from "../../__tests__/i18nWrapper";
import { OrderPlacing } from "./OrderPlacing";

describe("OrderPlacing", () => {
  it("shows the order being placed", () => {
    render(<OrderPlacing side="buy" />, { wrapper: I18nWrapper });

    expect(screen.getByText(ORDER_COPY.placing)).toBeOnTheScreen();
  });

  it("shows the shares being sold", () => {
    render(<OrderPlacing side="sale" />, { wrapper: I18nWrapper });

    expect(screen.getByText(SALE_COPY.placing)).toBeOnTheScreen();
  });
});
