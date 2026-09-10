import React from "react";
import { render, screen } from "@testing-library/react";
import { CardApiStoreProvider, makeCardApiStore } from "../../__tests__/cardApiStore";
import { CARD_COPY } from "../../__tests__/i18nWrapper";
import { WebTestWrapper } from "../../__tests__/webTestWrapper";
import { CardNumbers } from "./CardNumbers";
import { useFreezeCardViewModel } from "../Freeze/useFreezeCardViewModel";
import { useMoreViewModel } from "../More/useMoreViewModel";
import { buildMoreViewProps } from "../More/fixtures";
import type { TileProps } from "../../types";

jest.mock("../Freeze/useFreezeCardViewModel", () => ({ useFreezeCardViewModel: jest.fn() }));
jest.mock("../More/useMoreViewModel", () => ({ useMoreViewModel: jest.fn() }));

const freeze: TileProps = {
  status: "ACTIVE",
  isActionDisabled: false,
  confirmState: "closed",
  onOpenConfirm: jest.fn(),
  onClose: jest.fn(),
  onConfirm: jest.fn(),
};

describe("CardNumbers (web)", () => {
  beforeEach(() => {
    jest.mocked(useFreezeCardViewModel).mockReturnValue(freeze);
    jest.mocked(useMoreViewModel).mockReturnValue(buildMoreViewProps());
  });

  it("should show View beside Freeze and More", () => {
    render(
      <WebTestWrapper>
        <CardApiStoreProvider store={makeCardApiStore()}>
          <CardNumbers unlock={() => Promise.resolve(false)} />
        </CardApiStoreProvider>
      </WebTestWrapper>,
    );

    expect(screen.getByRole("button", { name: CARD_COPY.numbersReveal })).toBeVisible();
    expect(screen.getByRole("button", { name: "Freeze" })).toBeVisible();
    expect(screen.getByRole("button", { name: "More" })).toBeVisible();
  });
});
