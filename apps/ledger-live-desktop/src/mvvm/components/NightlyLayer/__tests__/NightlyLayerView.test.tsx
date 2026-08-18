import React from "react";
import { render, screen } from "tests/testSetup";
import { NightlyLayerView } from "../NightlyLayerView";

describe("NightlyLayerView", () => {
  it("renders prerelease watermarks with the app version", () => {
    render(
      <NightlyLayerView
        appVersion="2.0.0-nightly"
        watermarks={[
          { top: 50, left: 100 },
          { top: 150, left: 300 },
        ]}
      />,
    );

    expect(screen.getByTestId("nightly-layer")).toBeInTheDocument();
    expect(screen.getByTestId("nightly-layer").textContent).toMatch(
      /PRERELEASE[\s\S]*2\.0\.0-nightly/,
    );
    expect(screen.getByTestId("nightly-layer").children).toHaveLength(2);
  });
});
