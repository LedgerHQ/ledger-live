import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import DREPSearchInput, { NoResultPlaceholder } from "./DRepSearchInput";

jest.mock("~/renderer/screens/accounts/AccountList/SearchBox", () => ({
  __esModule: true,
  default: ({
    onTextChange,
    placeholder,
    search,
  }: {
    onTextChange: (val: string) => void;
    placeholder: string;
    search?: string;
  }) => (
    <input
      data-testid="mock-search-box"
      placeholder={placeholder}
      value={search || ""}
      onChange={e => onTextChange(e.target.value)}
    />
  ),
}));

describe("DRepSearchInput Component", () => {
  it("renders correctly with a placeholder", () => {
    const mockOnSearch = jest.fn();
    render(<DREPSearchInput onSearch={mockOnSearch} />);

    const searchInput = screen.getByTestId("mock-search-box");
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute("placeholder", "Search by name or DRep Id...");
  });

  it("calls onSearch when typing", () => {
    const mockOnSearch = jest.fn();
    render(<DREPSearchInput onSearch={mockOnSearch} />);

    const searchInput = screen.getByTestId("mock-search-box");
    fireEvent.change(searchInput, { target: { value: "test dRep" } });

    expect(mockOnSearch).toHaveBeenCalledWith("test dRep");
  });

  it("passes the search prop correctly", () => {
    const mockOnSearch = jest.fn();
    render(<DREPSearchInput onSearch={mockOnSearch} search="my-search" />);

    const searchInput = screen.getByTestId("mock-search-box");
    expect(searchInput).toHaveValue("my-search");
  });
});

describe("NoResultPlaceholder Component", () => {
  it("renders correctly with the search text", () => {
    render(<NoResultPlaceholder search="missing-drep" />);

    // Checks that the translated string logic attempts to render the text
    // "No DRep found for \"missing-drep\"."
    expect(screen.getByText(content => content.includes("No DRep found for"))).toBeInTheDocument();
    expect(screen.getByText("missing-drep")).toBeInTheDocument();
  });
});
