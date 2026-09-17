import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  CARD_DETAILS_IMAGE_URL,
  cardApiWrapper,
  listenToCardApi,
  revealCardDetailsHandler,
  signedInCardApiHandlers,
} from "@support/msw-features-flow-pay-card";
import { CARD_COPY, MORE_COPY } from "../../__tests__/i18nWrapper";
import { renderWeb } from "../../__tests__/renderWeb";
import { CardDetails } from "./CardDetails";

listenToCardApi([...signedInCardApiHandlers, revealCardDetailsHandler]);

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

  it("should keep View off the row when the host granted no unlock", async () => {
    renderWeb(
      <Wrapper>
        <CardDetails />
      </Wrapper>,
    );

    expect(await screen.findByRole("button", { name: CARD_COPY.freeze })).toBeVisible();
    expect(screen.queryByRole("button", { name: CARD_COPY.numbersReveal })).not.toBeInTheDocument();
  });

  it("should flip the card face to the numbers image once the user views them", async () => {
    renderWeb(
      <Wrapper>
        <CardDetails unlock={() => Promise.resolve(true)} />
      </Wrapper>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: CARD_COPY.numbersReveal }));

    const image = await screen.findByRole("img", { name: CARD_COPY.numbersImageAlt, hidden: true });
    expect(image).toHaveAttribute("src", CARD_DETAILS_IMAGE_URL);
    await act(async () => {
      image.dispatchEvent(new Event("load"));
    });

    expect(
      await screen.findByRole("button", { name: CARD_COPY.numbersHide }, { timeout: 1500 }),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: CARD_COPY.numbersReveal })).not.toBeInTheDocument();
  });
});
