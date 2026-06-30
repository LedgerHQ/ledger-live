import React from "react";
import { render, screen } from "tests/testSetup";
import { ScrollEdge } from "../ScrollEdge";

describe("ScrollEdge", () => {
  it("should render a left scroll edge with chevron", () => {
    render(<ScrollEdge direction="left" onClick={jest.fn()} />);

    expect(screen.getByLabelText("Scroll left")).toBeVisible();
    expect(screen.getByTestId("scroll-arrow-left")).toBeVisible();
  });

  it("should render a right scroll edge with chevron", () => {
    render(<ScrollEdge direction="right" onClick={jest.fn()} />);

    expect(screen.getByLabelText("Scroll right")).toBeVisible();
    expect(screen.getByTestId("scroll-arrow-right")).toBeVisible();
  });

  it("should keep the gradient always visible (no opacity toggle on the wrapper)", () => {
    render(<ScrollEdge direction="left" onClick={jest.fn()} />);

    const edge = screen.getByTestId("scroll-arrow-left");
    expect(edge).not.toHaveClass("opacity-0");

    const gradient = edge.querySelector(".bg-gradient-to-r");
    expect(gradient).toBeInTheDocument();
  });

  it("should not render the gradient when hideGradient is set, but keep the chevron", () => {
    render(<ScrollEdge direction="left" onClick={jest.fn()} hideGradient />);

    const edge = screen.getByTestId("scroll-arrow-left");
    expect(edge.querySelector(".bg-gradient-to-r")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Scroll left")).toBeInTheDocument();
  });

  it("should only reveal the chevron on hover", () => {
    render(<ScrollEdge direction="right" onClick={jest.fn()} />);

    const button = screen.getByLabelText("Scroll right");
    const chevronWrapper = button.parentElement;
    expect(chevronWrapper).toHaveClass("opacity-0");
    expect(chevronWrapper).toHaveClass("group-hover:opacity-100");
  });

  it("should trigger the callback on click", async () => {
    const onClick = jest.fn();
    const { user } = render(<ScrollEdge direction="right" onClick={onClick} />);

    await user.click(screen.getByLabelText("Scroll right"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
