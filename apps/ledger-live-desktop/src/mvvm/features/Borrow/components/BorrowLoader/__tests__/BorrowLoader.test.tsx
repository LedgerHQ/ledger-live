import React from "react";
import { render, screen } from "tests/testSetup";
import { BorrowLoader } from "../index";

jest.mock("~/renderer/components/BigSpinner", () => () => <div data-testid="borrow-loader-spinner" />);

describe("BorrowLoader", () => {
  it("returns null when loading is false", () => {
    const { container } = render(<BorrowLoader isLoading={false} />);

    expect(container.firstChild).toBeNull();
  });

  it("renders spinner when loading is true", () => {
    render(<BorrowLoader isLoading />);

    expect(screen.getByTestId("borrow-loader-spinner")).toBeVisible();
  });
});
