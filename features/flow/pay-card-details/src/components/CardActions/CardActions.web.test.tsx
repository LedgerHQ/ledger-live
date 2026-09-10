import React from "react";
import { render, screen } from "@testing-library/react";
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

describe("CardActions (web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useFreezeCardViewModel).mockReturnValue(freeze);
    jest.mocked(useMoreViewModel).mockReturnValue(more);
  });

  it("renders Freeze and More on the same row", () => {
    render(<CardActions />, { wrapper: WebTestWrapper });

    expect(screen.getByRole("button", { name: "Freeze" })).toBeVisible();
    expect(screen.getByRole("button", { name: "More" })).toBeVisible();
  });
});
