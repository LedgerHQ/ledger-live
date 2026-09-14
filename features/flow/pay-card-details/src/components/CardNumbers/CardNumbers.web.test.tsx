import React from "react";
import { render, screen } from "@testing-library/react";
import { CardApiStoreProvider, makeCardApiStore } from "@support/msw-features-flow-pay-card";
import { CardNumbers } from "./CardNumbers";

describe("CardNumbers (web)", () => {
  it("should render nothing when the desktop reveal UI has not shipped", () => {
    const store = makeCardApiStore();

    render(
      <CardApiStoreProvider store={store}>
        <CardNumbers unlock={() => Promise.resolve(false)} />
      </CardApiStoreProvider>,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
