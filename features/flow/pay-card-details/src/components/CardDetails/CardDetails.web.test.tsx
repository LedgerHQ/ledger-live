import React, { type PropsWithChildren } from "react";
import { screen } from "@testing-library/react";
import { SignedInCardApiProviders, listenToSignedInCardApi } from "../../__tests__/cardApiStore";
import { CARD_COPY, MORE_COPY } from "../../__tests__/i18nWrapper";
import { renderWeb } from "../../__tests__/renderWeb";
import { CardDetails } from "./CardDetails";

listenToSignedInCardApi();

function Wrapper({ children }: PropsWithChildren) {
  return <SignedInCardApiProviders>{children}</SignedInCardApiProviders>;
}

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
