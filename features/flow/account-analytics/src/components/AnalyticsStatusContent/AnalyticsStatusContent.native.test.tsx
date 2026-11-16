import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { AnalyticsStatusContent } from "./AnalyticsStatusContent";

const labels = {
  error: "Unable to load analytics",
  unavailable: "Data unavailable",
  retry: "Retry",
};

describe("AnalyticsStatusContent (native)", () => {
  it("should announce an error and retry on press", async () => {
    const onRetry = jest.fn();
    render(<AnalyticsStatusContent isError labels={labels} onRetry={onRetry} />);
    expect(screen.getByText(labels.error)).toHaveProp("accessibilityRole", "alert");

    await userEvent.press(screen.getByText(labels.retry));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should explain unavailable data without a retry", () => {
    render(<AnalyticsStatusContent isError={false} labels={labels} onRetry={jest.fn()} />);
    expect(screen.getByText(labels.unavailable)).toBeVisible();
    expect(screen.queryByText(labels.retry)).toBeNull();
  });
});
