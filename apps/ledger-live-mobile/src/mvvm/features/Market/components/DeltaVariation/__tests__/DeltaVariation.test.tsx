import React from "react";
import { render, screen } from "@tests/test-renderer";
import DeltaVariation from "../index";

describe("DeltaVariation", () => {
  it("should render nothing when value is NaN", () => {
    const { toJSON } = render(<DeltaVariation value={NaN} />);
    expect(toJSON()).toBeNull();
  });

  it("should render minus sign when rounded delta is 0", () => {
    render(<DeltaVariation value={0.001} />);
    expect(screen.getByText("−")).toBeOnTheScreen();
  });

  it("should render positive percentage with percent prop", () => {
    render(<DeltaVariation value={5.25} percent />);
    expect(screen.getByText("5.25%")).toBeOnTheScreen();
  });

  it("should render negative percentage with percent prop", () => {
    render(<DeltaVariation value={-3.14} percent />);
    expect(screen.getByText("3.14%")).toBeOnTheScreen();
  });

  it("should render positive absolute value without percent prop", () => {
    render(<DeltaVariation value={42} />);
    expect(screen.getByText("+42")).toBeOnTheScreen();
  });

  it("should render negative absolute value without percent prop", () => {
    render(<DeltaVariation value={-7.5} />);
    expect(screen.getByText("-7.5")).toBeOnTheScreen();
  });
});
