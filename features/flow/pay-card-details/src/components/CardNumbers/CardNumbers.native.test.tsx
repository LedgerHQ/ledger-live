import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardApiStoreProvider, makeCardApiStore } from "@support/msw-features-flow-pay-card";
import { CARD_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { CardNumbers } from "./CardNumbers";

describe("CardNumbers (native)", () => {
  it("should hide the card numbers image before View", () => {
    render(
      <I18nWrapper>
        <CardApiStoreProvider store={makeCardApiStore()}>
          <CardNumbers unlock={() => Promise.resolve(false)} cardFace={<></>} />
        </CardApiStoreProvider>
      </I18nWrapper>,
    );

    expect(screen.queryByLabelText(CARD_COPY.numbersImageAlt)).not.toBeOnTheScreen();
  });
});
