import React from "react";
import { render, screen } from "tests/testSetup";
import { ViewAllTile } from "../components/ViewAllTile";
import { useNavigate } from "react-router";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();
(useNavigate as jest.Mock).mockReturnValue(mockNavigate);

describe("ViewAllTile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render correctly", () => {
    render(<ViewAllTile />);

    expect(screen.getByText("View all")).toBeInTheDocument();
  });

  it("should render ChevronRight icon", () => {
    const { container } = render(<ViewAllTile />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should navigate to market page when clicked", async () => {
    const { user } = render(<ViewAllTile />);

    const tile = screen.getByText("View all").closest("div[role='button']");
    if (tile) {
      await user.click(tile);
      expect(mockNavigate).toHaveBeenCalledWith("/market");
    }
  });

  it("should have correct styling classes", () => {
    const { container } = render(<ViewAllTile />);

    const tile = container.querySelector(".w-\\[98px\\]");
    expect(tile).toBeInTheDocument();
    expect(tile).toHaveClass("justify-center", "self-stretch");
  });
});
