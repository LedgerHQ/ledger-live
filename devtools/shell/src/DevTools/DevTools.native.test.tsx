import { fireEvent, render, screen } from "jest/render.native";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import type { PartialFeatures } from "@shared/feature-flags";
import { FEATURE_FLAGS_ID } from "../toolIds";
import { DevTools } from "./DevTools.native";

const featureFlagsProps = {
  resolved: FEATURE_FLAGS_INITIAL_STATE.resolved,
  overrides: {} as PartialFeatures,
  setOverride: jest.fn(),
  clearOverride: jest.fn(),
  clearAllOverrides: jest.fn(),
};

describe("DevTools (native)", () => {
  it("renders the shell", () => {
    render(<DevTools />);
    expect(screen.getByTestId("devtools")).toBeOnTheScreen();
  });

  it("shows category list on the home screen", () => {
    render(<DevTools />);
    expect(screen.getByTestId("devtools-home")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Configuration" })).toBeOnTheScreen();
  });

  it("shows no tool screen when on home", () => {
    render(<DevTools />);
    expect(screen.queryByTestId("devtools-content")).toBeNull();
  });

  it("tapping a category shows its tools", () => {
    render(<DevTools />);
    fireEvent.press(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Feature Flags" })).toBeOnTheScreen();
  });

  it("tapping back from category returns to home", () => {
    render(<DevTools />);
    fireEvent.press(screen.getByRole("button", { name: "Configuration" }));
    fireEvent.press(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByTestId("devtools-home")).toBeOnTheScreen();
  });

  it("tapping a tool shows the tool screen", () => {
    render(<DevTools {...{ [FEATURE_FLAGS_ID]: featureFlagsProps }} />);
    fireEvent.press(screen.getByRole("button", { name: "Configuration" }));
    fireEvent.press(screen.getByRole("button", { name: "Feature Flags" }));
    expect(screen.getByTestId("devtools-content")).toBeOnTheScreen();
    expect(screen.getByTestId("devtools-content")).toHaveTextContent(/Feature Flags/);
  });

});
