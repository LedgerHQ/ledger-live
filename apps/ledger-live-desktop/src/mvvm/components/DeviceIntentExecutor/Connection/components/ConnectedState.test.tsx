import React from "react";
import { render } from "tests/testSetup";

import { ConnectedState } from "./ConnectedState";

describe("ConnectedState", () => {
  it("GIVEN a connected device WHEN rendering THEN it renders nothing", () => {
    // WHEN
    const { container } = render(<ConnectedState />);

    // THEN
    expect(container).toBeEmptyDOMElement();
  });
});
