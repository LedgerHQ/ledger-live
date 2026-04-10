import React from "react";
import { render } from "@tests/test-renderer";
import { OperationsEmptyState } from "../OperationsEmptyState";

describe("OperationsEmptyState", () => {
  it("renders the empty state title and subtitle", () => {
    const { getByText } = render(<OperationsEmptyState />);
    expect(getByText(/no transactions yet/i)).toBeVisible();
    expect(getByText(/come back later to see your transactions/i)).toBeVisible();
  });

  it("renders the receive CTA button", () => {
    const { getByText } = render(<OperationsEmptyState />);
    expect(getByText(/receive/i)).toBeVisible();
  });
});
