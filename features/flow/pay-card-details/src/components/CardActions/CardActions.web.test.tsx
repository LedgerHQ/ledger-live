import React from "react";
import { screen } from "@testing-library/react";
import {
  cardApiWrapper,
  listenToCardApi,
  signedInCardApiHandlers,
} from "@support/msw-features-flow-pay-card";
import { CARD_COPY, MORE_COPY } from "../../__tests__/i18nWrapper";
import { renderWeb } from "../../__tests__/renderWeb";
import type { RevealTileProps } from "../../types";
import { CardActions } from "./CardActions";

listenToCardApi(signedInCardApiHandlers);

const Wrapper = cardApiWrapper({ signedIn: true });

const reveal: RevealTileProps = {
  status: "idle",
  isRevealed: false,
  onReveal: jest.fn(),
  onHide: jest.fn(),
};

describe("CardActions (web)", () => {
  it("should line up Reveal, Freeze and More when a reveal is passed in", async () => {
    renderWeb(
      <Wrapper>
        <CardActions reveal={reveal} />
      </Wrapper>,
    );

    expect(screen.getByRole("button", { name: CARD_COPY.numbersReveal })).toBeVisible();
    expect(await screen.findByRole("button", { name: CARD_COPY.freeze })).toBeVisible();
    expect(await screen.findByRole("button", { name: MORE_COPY.tile })).toBeVisible();
  });

  it("should leave Reveal out of the row when no reveal is passed in", async () => {
    renderWeb(
      <Wrapper>
        <CardActions />
      </Wrapper>,
    );

    expect(await screen.findByRole("button", { name: CARD_COPY.freeze })).toBeVisible();
    expect(screen.queryByRole("button", { name: CARD_COPY.numbersReveal })).not.toBeInTheDocument();
  });
});
