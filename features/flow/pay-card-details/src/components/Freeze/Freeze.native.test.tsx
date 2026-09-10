import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CARD_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { Freeze } from "./Freeze";
import { useFreezeCardViewModel } from "./useFreezeCardViewModel";
import type { FreezeViewModel } from "../../types";

jest.mock("./useFreezeCardViewModel", () => ({ useFreezeCardViewModel: jest.fn() }));

const viewModel: FreezeViewModel = {
  status: "ACTIVE",
  isActionDisabled: false,
  confirmState: "closed",
  onOpenConfirm: jest.fn(),
  onClose: jest.fn(),
  onConfirm: jest.fn(),
};

describe("Freeze (native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useFreezeCardViewModel).mockReturnValue(viewModel);
  });

  it("should render the freeze tile", () => {
    render(<Freeze />, { wrapper: I18nWrapper });

    expect(screen.getByText(CARD_COPY.freeze)).toBeVisible();
  });
});
