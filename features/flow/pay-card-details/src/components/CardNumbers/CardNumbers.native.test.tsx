import React from "react";
import { View } from "react-native";
import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import {
  CARD_API_BASE_URL,
  CardApiStoreProvider,
  listenToCardApi,
  makeCardApiStore,
} from "@support/msw-features-flow-pay-card";
import { CARD_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { CardNumbers } from "./CardNumbers";

const CARD_DETAILS_TOKEN = "00000000-0000-4000-8000-000000000000";
const CARD_DETAILS = {
  token: CARD_DETAILS_TOKEN,
  imageUrl: `${CARD_API_BASE_URL}/details-image?token=${CARD_DETAILS_TOKEN}`,
};
const CARD_DETAILS_TOKEN_URL = `${CARD_API_BASE_URL}/v1/card/details/token`;

const server = listenToCardApi();

beforeEach(() => {
  server.use(http.post(CARD_DETAILS_TOKEN_URL, () => HttpResponse.json(CARD_DETAILS)));
});

function renderNumbers(unlock: () => Promise<boolean>) {
  return render(
    <I18nWrapper>
      <CardApiStoreProvider store={makeCardApiStore()}>
        <CardNumbers unlock={unlock} cardFace={<View testID="card-face" />} />
      </CardApiStoreProvider>
    </I18nWrapper>,
  );
}

describe("CardNumbers (native)", () => {
  it("should show View when unlock is provided", () => {
    renderNumbers(() => Promise.resolve(false));

    expect(screen.getByText(CARD_COPY.numbersReveal)).toBeVisible();
    expect(screen.getByTestId("card-face")).toBeVisible();
  });

  it("should show the details image and Hide when the user taps View", async () => {
    const user = userEvent.setup();
    renderNumbers(() => Promise.resolve(true));

    await user.press(screen.getByText(CARD_COPY.numbersReveal));

    await waitFor(() => {
      expect(screen.getByLabelText(CARD_COPY.numbersImageAlt)).toBeVisible();
    });
    expect(screen.getByText(CARD_COPY.numbersHide)).toBeVisible();
    expect(screen.queryByTestId("card-face")).not.toBeOnTheScreen();
  });

  it("should show the card face again when the user taps Hide", async () => {
    const user = userEvent.setup();
    renderNumbers(() => Promise.resolve(true));

    await user.press(screen.getByText(CARD_COPY.numbersReveal));
    await waitFor(() => {
      expect(screen.getByLabelText(CARD_COPY.numbersImageAlt)).toBeVisible();
    });

    await user.press(screen.getByText(CARD_COPY.numbersHide));

    expect(screen.getByTestId("card-face")).toBeVisible();
    expect(screen.getByText(CARD_COPY.numbersReveal)).toBeVisible();
    expect(screen.queryByLabelText(CARD_COPY.numbersImageAlt)).not.toBeOnTheScreen();
  });
});
