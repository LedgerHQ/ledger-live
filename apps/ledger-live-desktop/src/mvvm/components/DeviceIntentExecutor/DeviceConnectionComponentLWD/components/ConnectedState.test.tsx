import React from "react";

import { renderWithUser } from "../testUtils";
import { ConnectedState } from "./ConnectedState";

describe("ConnectedState", () => {
  it("GIVEN a connected device WHEN rendering THEN it renders nothing", () => {
    // WHEN
    const { container } = renderWithUser(<ConnectedState />);

    // THEN
    expect(container).toBeEmptyDOMElement();
  });
});
