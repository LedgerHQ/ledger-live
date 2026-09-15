import React from "react";
import { render, screen } from "@testing-library/react";
import { CARD_COPY } from "../../__tests__/i18nWrapper";
import { WebTestWrapper } from "../../__tests__/webTestWrapper";
import { CardActions } from "./CardActions";
import { useFreezeCardViewModel } from "../Freeze/useFreezeCardViewModel";
import { useMoreViewModel } from "../More/useMoreViewModel";
import { buildMoreViewProps } from "../More/fixtures";
import type { FreezeViewModel } from "../../types";

jest.mock("../Freeze/useFreezeCardViewModel", () => ({ useFreezeCardViewModel: jest.fn() }));
jest.mock("../More/useMoreViewModel", () => ({ useMoreViewModel: jest.fn() }));

const freeze: FreezeViewModel = {
  status: "ACTIVE",
  isActionDisabled: false,
  confirmState: "closed",
  onOpenConfirm: jest.fn(),
  onClose: jest.fn(),
  onConfirm: jest.fn(),
};

const more = buildMoreViewProps();

const idleCardNumbersViewModel = {
  status: "idle" as const,
  imageUrl: undefined,
  onReveal: jest.fn(),
  onHide: jest.fn(),
};

describe("CardActions (web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useFreezeCardViewModel).mockReturnValue(freeze);
    jest.mocked(useMoreViewModel).mockReturnValue(more);
  });

  it("should render Freeze and More on the same row", () => {
    render(<CardActions />, { wrapper: WebTestWrapper });

    expect(screen.queryByRole("button", { name: "View" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Freeze" })).toBeVisible();
    expect(screen.getByRole("button", { name: "More" })).toBeVisible();
  });

  it("should render Reveal beside Freeze and More when the card numbers view model is passed", () => {
    render(<CardActions cardNumbersViewModel={idleCardNumbersViewModel} />, {
      wrapper: WebTestWrapper,
    });

    expect(screen.getByRole("button", { name: "View" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Freeze" })).toBeVisible();
    expect(screen.getByRole("button", { name: "More" })).toBeVisible();
  });

  it("should keep the failed message under Reveal, not beside Freeze", () => {
    render(
      <CardActions cardNumbersViewModel={{ ...idleCardNumbersViewModel, status: "failed" }} />,
      {
        wrapper: WebTestWrapper,
      },
    );

    const row = screen.getByRole("button", { name: "Freeze" }).parentElement;
    const failed = screen.getByText(CARD_COPY.numbersFailed);

    expect(row?.childElementCount).toBe(3);
    expect(failed).toBeVisible();
    expect(screen.getByRole("button", { name: "View" }).parentElement).toContainElement(failed);
  });
});
