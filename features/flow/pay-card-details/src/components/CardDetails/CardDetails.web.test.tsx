import React from "react";
import { screen } from "@testing-library/react";
import { cardApiWrapper, listenToCardApi } from "@support/msw-features-flow-pay-card";
import { CARD_COPY, MORE_COPY } from "../../__tests__/i18nWrapper";
import { renderWeb } from "../../__tests__/renderWeb";
import { signedInCardApiHandlers } from "./signedInCardApi";
import { CardDetails } from "./CardDetails";

listenToCardApi(signedInCardApiHandlers);

const Wrapper = cardApiWrapper({ signedIn: true });

describe("CardDetails (web)", () => {
  it("shows the card face with the freeze and more actions", async () => {
    renderWeb(
      <Wrapper>
        <CardDetails />
      </Wrapper>,
    );

    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(await screen.findByRole("button", { name: CARD_COPY.freeze })).toBeVisible();
    expect(await screen.findByRole("button", { name: MORE_COPY.tile })).toBeVisible();
  });
});
