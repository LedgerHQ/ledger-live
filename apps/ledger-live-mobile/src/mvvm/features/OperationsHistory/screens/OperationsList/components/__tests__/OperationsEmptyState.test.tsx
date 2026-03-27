import React from "react";
import { render } from "@tests/test-renderer";
import { OperationsEmptyState } from "../OperationsEmptyState";

describe("OperationsEmptyState", () => {
  it("renders the empty state title", () => {
    const { getByText } = render(<OperationsEmptyState />);
    expect(getByText(/no transactions yet/i)).toBeVisible();
  });

  it("renders the empty state subtitle", () => {
    const { getByText } = render(<OperationsEmptyState />);
    expect(getByText(/come back later to see your transactions/i)).toBeVisible();
  });
});
