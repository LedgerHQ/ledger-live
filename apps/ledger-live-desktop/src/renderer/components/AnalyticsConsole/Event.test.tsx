import React from "react";
import { render, screen } from "tests/testSetup";
import Event from "./Event";

describe("Event Component", () => {
  const baseProps = {
    eventName: "Test Event",
    date: new Date("2025-06-05T12:00:00Z"),
    eventProperties: {},
    eventPropertiesWithoutExtra: {},
    showExtraProps: true,
    id: 1,
  };

  it("renders event name and date correctly", () => {
    render(<Event {...baseProps} />);

    expect(screen.getByText(/Test Event/i)).toBeVisible();
    expect(screen.getByText(/2:00:00 PM/i)).toBeVisible();
  });

  it("renders string properties correctly", () => {
    const props = {
      ...baseProps,
      eventProperties: { key1: "value1", key2: "value2" },
    };
    render(<Event {...props} />);

    expect(screen.getByText(/key1: "value1"/i)).toBeVisible();
    expect(screen.getByText(/key2: "value2"/i)).toBeVisible();
  });

  it("renders array properties correctly", () => {
    const props = {
      ...baseProps,
      eventProperties: { key1: ["value1", "value2"], key2: "value3" },
    };
    render(<Event {...props} />);

    expect(screen.getByText(/key1: \[value1, value2\]/i)).toBeVisible();
    expect(screen.getByText(/key2: "value3"/i)).toBeVisible();
  });

  it("renders object properties correctly", () => {
    const props = {
      ...baseProps,
      eventProperties: { key1: ["test1", "test2"] },
    };
    render(<Event {...props} />);

    expect(screen.getByText(/key1: \[test1, test2\]/i)).toBeVisible();
  });
});
