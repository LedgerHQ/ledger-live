import React from "react";
import { render, screen } from "tests/testSetup";
import CustomCALRefInput from "./CustomCALRefInput";
import { setEnv } from "@ledgerhq/live-env";

describe("CustomCALRefInput", () => {
  it("does not display any custom CAL ref", () => {
    render(<CustomCALRefInput />);

    expect(screen.queryByTestId("custom-cal-ref-input")).toBeNull();
    expect(screen.queryByTestId("custom-cal-ref-button")).toBeNull();
  });

  it("displays a custom CAL ref", () => {
    setEnv("CAL_REF", "branch:next");
    render(<CustomCALRefInput />);

    expect(screen.queryByTestId("custom-cal-ref-input")).toHaveValue("branch:next");
    expect(screen.queryByTestId("custom-cal-ref-button")).toHaveTextContent("Apply");
  });
});
