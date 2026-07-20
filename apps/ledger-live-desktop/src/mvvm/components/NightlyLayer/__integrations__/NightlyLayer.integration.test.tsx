import React from "react";
import { render, screen } from "tests/testSetup";
import NightlyLayer from "../index";
import { useNightlyLayerViewModel } from "../useNightlyLayerViewModel";

jest.mock("../useNightlyLayerViewModel");

const mockUseNightlyLayerViewModel = jest.mocked(useNightlyLayerViewModel);

describe("NightlyLayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render the watermark overlay when not visible", () => {
    mockUseNightlyLayerViewModel.mockReturnValue({
      isVisible: false,
      appVersion: "2.0.0",
      watermarks: [],
    });

    render(<NightlyLayer />);

    expect(screen.queryByTestId("nightly-layer")).not.toBeInTheDocument();
  });

  it("renders the watermark overlay when visible", () => {
    mockUseNightlyLayerViewModel.mockReturnValue({
      isVisible: true,
      appVersion: "2.0.0-nightly",
      watermarks: [{ top: 50, left: 100 }],
    });

    render(<NightlyLayer />);

    expect(screen.getByTestId("nightly-layer")).toBeInTheDocument();
    expect(screen.getByTestId("nightly-layer").textContent).toContain("2.0.0-nightly");
  });
});
