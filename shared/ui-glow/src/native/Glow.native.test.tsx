import React from "react";
import { Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { GLOW_DEFAULTS, GLOW_PARAM_ORDER, Glow } from "./index";

describe("Glow", () => {
  it("should pass every param to the shader, in the uniform order", () => {
    render(<Glow testID="glow" params={{ grain: 0.9 }} />);

    const params = screen.getByTestId("glow").props.params;
    expect(params).toHaveLength(GLOW_PARAM_ORDER.length);
    expect(params[GLOW_PARAM_ORDER.indexOf("grain")]).toBe(0.9);
    expect(params[GLOW_PARAM_ORDER.indexOf("intensity")]).toBe(GLOW_DEFAULTS.intensity);
  });

  it("should pass the glows to show, never as layout props (`position`, `top`, `bottom`)", () => {
    render(<Glow testID="glow" showTop={false} showBottom />);

    const view = screen.getByTestId("glow");
    expect(view.props.showTop).toBe(false);
    expect(view.props.showBottom).toBe(true);
    expect(view.props.position).toBeUndefined();
    expect(view.props.top).toBeUndefined();
    expect(view.props.bottom).toBeUndefined();
  });

  it("should show the fallback only when the shader fails", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    render(<Glow testID="glow" fallback={<Text>Static glow</Text>} />);
    expect(screen.queryByText("Static glow")).toBeNull();

    fireEvent(screen.getByTestId("glow"), "shaderError", {
      nativeEvent: { message: "compile error" },
    });

    expect(screen.getByText("Static glow")).toBeOnTheScreen();
    warn.mockRestore();
  });
});
