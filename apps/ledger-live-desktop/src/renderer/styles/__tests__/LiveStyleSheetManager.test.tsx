import React from "react";
import { render, screen } from "tests/testSetup";
import LiveStyleSheetManager from "../LiveStyleSheetManager";

describe("LiveStyleSheetManager", () => {
  it("renders children wrapped in StyleSheetManager", () => {
    render(
      <LiveStyleSheetManager>
        <span data-testid="child">Child content</span>
      </LiveStyleSheetManager>,
      { minimal: true },
    );

    expect(screen.getByTestId("child")).toHaveTextContent("Child content");
  });
});
