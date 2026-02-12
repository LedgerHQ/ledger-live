import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { render, screen } from "@tests/test-renderer";
import React from "react";
import { ErrorSection } from "../components/ErrorSection";

describe("ErrorSection", () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with generic error", () => {
    const error = new Error("Error");
    render(<ErrorSection error={error} disabled={false} onRetry={mockOnRetry} />);

    expect(screen.getByText("Error")).toBeDefined();
    expect(screen.getByText("Retry")).toBeDefined();
  });

  it("should render retry button", () => {
    const error = new Error("Test error");
    render(<ErrorSection error={error} disabled={false} onRetry={mockOnRetry} />);

    expect(screen.getByText("Retry")).toBeDefined();
  });

  it("should render UserRefusedOnDevice error with warning", () => {
    const error = new UserRefusedOnDevice();
    render(<ErrorSection error={error} disabled={false} onRetry={mockOnRetry} />);

    expect(screen.getByText("Operation canceled on device")).toBeDefined();
    expect(screen.getByText("You rejected the operation on the device.")).toBeDefined();
  });

  it("should render LockedDeviceError", () => {
    const error = new LockedDeviceError();
    render(<ErrorSection error={error} disabled={false} onRetry={mockOnRetry} />);

    expect(screen.getByText("Your device is locked")).toBeDefined();
    expect(screen.getByText("Unlock your device and try again.")).toBeDefined();
  });

  it("should show learn more link for 429 error", () => {
    const error: Error & { status: number } = Object.assign(new Error("Rate limit"), {
      status: 429,
    });
    render(<ErrorSection error={error} disabled={false} onRetry={mockOnRetry} />);

    expect(
      screen.getByText(
        "Canton Network currently supports a limited number of account creations per day. Please try again later.",
      ),
    ).toBeDefined();
    expect(screen.getByText("Learn more")).toBeDefined();
  });
});
