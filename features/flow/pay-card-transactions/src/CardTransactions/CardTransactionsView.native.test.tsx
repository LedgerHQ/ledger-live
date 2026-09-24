import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardTransactionsView } from "./CardTransactionsView";
import type { CardTransactionsScreenViewProps } from "./types";

const defaultProps: CardTransactionsScreenViewProps = {
  displayState: "empty",
  title: "Transactions",
  transactions: [],
};

describe("CardTransactionsView (native)", () => {
  it.each(["loading", "error", "empty"] as const)(
    "renders nothing when displayState is %s",
    displayState => {
      render(<CardTransactionsView {...defaultProps} displayState={displayState} />);

      expect(screen.queryByTestId("card-transactions")).toBeNull();
    },
  );
});
