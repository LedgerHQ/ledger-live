import React from "react";

import { renderWithUser } from "../testUtils";
import { ConnectedState } from "./ConnectedState";

describe("ConnectedState", () => {
  it("should render nothing when the device is connected", () => {
    const { container } = renderWithUser(<ConnectedState />);

    expect(container).toBeEmptyDOMElement();
  });
});
