import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import CustomCALRefInput from "./CustomCALRefInput";
import { setEnv } from "@ledgerhq/live-env";

describe("CustomCALRefInput", () => {
  it("does not display any custom CAL ref", () => {
    render(<CustomCALRefInput />);

    expect(screen.queryByTestId("custom-cal-ref-input")).toBeNull();
    expect(screen.queryByTestId("custom-cal-ref-switch").props.value).toBe(false);
    expect(screen.queryByText("Apply")).toBeNull();
  });

  it("displays a custom CAL ref", () => {
    setEnv("CAL_REF", "branch:next");
    render(<CustomCALRefInput />);

    expect(screen.queryByTestId("custom-cal-ref-input").props.value).toEqual("branch:next");
    expect(screen.queryByTestId("custom-cal-ref-switch").props.value).toBe(true);
    expect(screen.queryByText("Apply")).toBeDisabled();
  });
});
