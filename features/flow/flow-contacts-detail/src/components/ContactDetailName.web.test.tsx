import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ContactDetailName } from "./ContactDetailName.web";

function setTextMetrics(element: HTMLElement, scrollWidth: number, clientWidth: number) {
  Object.defineProperty(element, "scrollWidth", { configurable: true, value: scrollWidth });
  Object.defineProperty(element, "clientWidth", { configurable: true, value: clientWidth });
}

function getTooltipContainer(): HTMLElement {
  const tooltipContainer = screen.getByTestId("contacts-detail-name").parentElement;
  if (tooltipContainer === null) {
    throw new Error("The Tooltip mock should render a container");
  }
  return tooltipContainer;
}

describe("ContactDetailName", () => {
  it("should show the full name in a tooltip only when the title is truncated", () => {
    const name = "Z".repeat(64);
    render(<ContactDetailName name={name} />);

    const title = screen.getByTestId("contacts-detail-name");
    const tooltip = getTooltipContainer();

    expect(title).toHaveTextContent(name);
    expect(title).toHaveClass("min-w-0", "max-w-full", "truncate");

    setTextMetrics(title, 100, 100);
    fireEvent.mouseEnter(tooltip);
    expect(tooltip).toHaveAttribute("data-open", "false");

    setTextMetrics(title, 200, 100);
    fireEvent.mouseEnter(tooltip);
    expect(tooltip).toHaveAttribute("data-open", "true");

    fireEvent.mouseLeave(tooltip);
    expect(tooltip).toHaveAttribute("data-open", "false");
  });
});
