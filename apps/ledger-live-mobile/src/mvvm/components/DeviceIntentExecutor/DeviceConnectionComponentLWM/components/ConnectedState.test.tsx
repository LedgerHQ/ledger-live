import React from "react";
import { render } from "@tests/test-renderer";
import { ConnectedState } from "./ConnectedState";

describe("ConnectedState", () => {
  it("should render nothing", () => {
    const { toJSON } = render(<ConnectedState />);

    expect(toJSON()).toBeNull();
  });
});
