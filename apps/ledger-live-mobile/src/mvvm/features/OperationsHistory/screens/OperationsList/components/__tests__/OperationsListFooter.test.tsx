import React from "react";
import { render } from "@tests/test-renderer";
import { OperationsListFooter } from "../OperationsListFooter";

const SPINNER_TEST_ID = "operations-list-footer-spinner";

describe("OperationsListFooter", () => {
  it("renders the loading spinner when completed is false", () => {
    const { getByTestId } = render(<OperationsListFooter completed={false} />);
    expect(getByTestId(SPINNER_TEST_ID)).toBeVisible();
  });

  it("renders nothing when completed is true", () => {
    const { queryByTestId } = render(<OperationsListFooter completed={true} />);
    expect(queryByTestId(SPINNER_TEST_ID)).not.toBeVisible();
  });
});
