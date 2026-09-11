import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardApiStoreProvider, makeCardApiStore } from "@support/msw-features-flow-pay-card";
import { CardNumbers } from "./CardNumbers";

describe("CardNumbers (native)", () => {
  it("should render nothing when the mobile reveal UI has not shipped", () => {
    const store = makeCardApiStore();

    render(
      <CardApiStoreProvider store={store}>
        <CardNumbers unlock={() => Promise.resolve(false)} />
      </CardApiStoreProvider>,
    );

    expect(screen.queryByTestId("card-numbers")).not.toBeOnTheScreen();
  });
});
