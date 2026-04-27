import React from "react";
import { t } from "i18next";
import { render, screen } from "tests/testSetup";
import { useBorrowEntryPointViewModel } from "../../../hooks/useBorrowEntryPointViewModel";
import { BorrowEntryPoint } from "../index";

jest.mock("../../../hooks/useBorrowEntryPointViewModel");

const mockedUseBorrowEntryPointViewModel = jest.mocked(useBorrowEntryPointViewModel);

describe("BorrowEntryPoint", () => {
  const handleClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseBorrowEntryPointViewModel.mockReturnValue({ handleClick });
  });

  it("should render the borrow entry point card with translated content", () => {
    render(<BorrowEntryPoint />);

    expect(screen.getByTestId("portfolio-borrow-entry-point")).toBeVisible();
    expect(screen.getByText(t("portfolio.borrowEntry.title"))).toBeVisible();
    expect(screen.getByText(t("portfolio.borrowEntry.cardTitle"))).toBeVisible();
    expect(screen.getByText(t("portfolio.borrowEntry.cardDescription"))).toBeVisible();
  });

  it("should call the view model handleClick when the CTA is clicked", async () => {
    const { user } = render(<BorrowEntryPoint />);

    await user.click(screen.getByText(t("portfolio.borrowEntry.cta")));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
