import React from "react";
import { render, screen } from "tests/testSetup";
import { AnimatedLogo } from "../index";

jest.mock("react-lottie", () => {
  const MockLottie = (props: Record<string, unknown>) => (
    <div data-testid="lottie" data-is-paused={String(props.isPaused)} />
  );
  MockLottie.displayName = "MockLottie";
  return MockLottie;
});

jest.mock("../dark/collapse.json", () => ({ id: "dark-collapse" }));
jest.mock("../dark/expand.json", () => ({ id: "dark-expand" }));
jest.mock("../light/collapse.json", () => ({ id: "light-collapse" }));
jest.mock("../light/expand.json", () => ({ id: "light-expand" }));

describe("AnimatedLogo", () => {
  it("should render the Lottie component", () => {
    render(<AnimatedLogo collapsed={false} />, {
      initialState: { settings: { theme: "dark" } },
    });

    expect(screen.getByTestId("lottie")).toBeInTheDocument();
  });

  it("should render paused when not transitioning", () => {
    render(<AnimatedLogo collapsed={false} />, {
      initialState: { settings: { theme: "dark" } },
    });

    expect(screen.getByTestId("lottie")).toHaveAttribute("data-is-paused", "true");
  });

  it("should render with light theme", () => {
    render(<AnimatedLogo collapsed={false} />, {
      initialState: { settings: { theme: "light" } },
    });

    expect(screen.getByTestId("lottie")).toBeInTheDocument();
  });

  it("should render when collapsed is true", () => {
    render(<AnimatedLogo collapsed={true} />, {
      initialState: { settings: { theme: "dark" } },
    });

    expect(screen.getByTestId("lottie")).toBeInTheDocument();
  });
});
