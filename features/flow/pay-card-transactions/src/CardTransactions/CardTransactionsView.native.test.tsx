import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardTransactionsView } from "./CardTransactionsView";
import type { CardTransactionsScreenViewProps } from "./types";

const defaultProps: CardTransactionsScreenViewProps = {
  displayMode: "empty",
  title: "Transactions",
  transactions: [],
};

describe("CardTransactionsView (native)", () => {
  it.each(["loading", "error", "empty"] as const)("renders nothing in %s mode", displayMode => {
    render(<CardTransactionsView {...defaultProps} displayMode={displayMode} />);

    expect(screen.queryByTestId("card-transactions")).toBeNull();
  });
});
