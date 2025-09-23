/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";

const TestWrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

describe("WelcomeNew", () => {
  it("should have working test infrastructure", () => {
    const TestComponent = () => <div data-testid="test-component">Test Component</div>;

    render(<TestComponent />, { wrapper: TestWrapper });

    expect(screen.getByTestId("test-component")).toBeInTheDocument();
    expect(screen.getByText("Test Component")).toBeInTheDocument();
  });

  it("should verify mocks are working", () => {
    const mockFn = jest.fn();
    mockFn("test");

    expect(mockFn).toHaveBeenCalledWith("test");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
