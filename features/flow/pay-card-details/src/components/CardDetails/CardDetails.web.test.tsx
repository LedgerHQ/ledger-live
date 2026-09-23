import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  cardApiWrapper,
  listenToCardApi,
  revealCardDetailsHandler,
  revealCardDetailsImageHandler,
  signedInCardApiHandlers,
} from "@support/msw-features-flow-pay-card";
import { CARD_COPY, MORE_COPY, openExternalMock } from "../../__tests__/i18nWrapper";
import { renderWeb } from "../../__tests__/renderWeb";
import { urls } from "../../urls";
import { CardDetails } from "./CardDetails";

listenToCardApi([
  ...signedInCardApiHandlers,
  revealCardDetailsHandler,
  revealCardDetailsImageHandler,
]);

const Wrapper = cardApiWrapper({ signedIn: true });

describe("CardDetails (web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it("should flip the card face to the numbers image once the user views them", async () => {
    renderWeb(
      <Wrapper>
        <CardDetails />
      </Wrapper>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: CARD_COPY.numbersReveal }));

    const image = await screen.findByRole("img", { name: CARD_COPY.numbersImageAlt, hidden: true });
    expect(image.getAttribute("src")).toMatch(/^data:image\/png;base64,/);
    await act(async () => {
      image.dispatchEvent(new Event("load"));
    });

    expect(screen.getByRole("button", { name: CARD_COPY.numbersHide })).toBeVisible();
    expect(screen.queryByRole("button", { name: CARD_COPY.numbersReveal })).not.toBeInTheDocument();
  });

  it("wires the host's redirect actions to the More sheet's rows, with a single More tile", async () => {
    const onManagePin = jest.fn();
    const onAccessBaanx = jest.fn();

    renderWeb(
      <Wrapper>
        <CardDetails cardSettingsActions={{ onManagePin, onAccessBaanx }} />
      </Wrapper>,
    );

    const moreTiles = await screen.findAllByRole("button", { name: MORE_COPY.tile });
    expect(moreTiles).toHaveLength(1);

    const user = userEvent.setup();
    await user.click(moreTiles[0]);
    await user.click(await screen.findByRole("button", { name: MORE_COPY.rows.managePin }));

    expect(onManagePin).toHaveBeenCalledTimes(1);
    expect(onAccessBaanx).not.toHaveBeenCalled();
  });

  it("opens the help center and legal agreement links directly from the More sheet", async () => {
    renderWeb(
      <Wrapper>
        <CardDetails />
      </Wrapper>,
    );

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: MORE_COPY.tile }));
    await user.click(await screen.findByRole("button", { name: MORE_COPY.rows.help }));
    expect(openExternalMock).toHaveBeenCalledWith(urls.helpCenter);

    await user.click(await screen.findByRole("button", { name: MORE_COPY.rows.legal }));
    expect(openExternalMock).toHaveBeenCalledWith(urls.legalAgreement);
  });
});
