import { fireEvent, render, screen } from "@testing-library/react";
import { Sidebar } from "../../components/Sidebar.web";
import { Category } from "../../types";

const categories = [
  {
    category: Category.CONFIGURATION,
    tools: [{ id: "feature-flags", label: "Feature Flags", category: Category.CONFIGURATION }],
  },
  {
    category: Category.CONNECTIVITY,
    tools: [
      { id: "network-inspector", label: "Network Inspector", category: Category.CONNECTIVITY },
    ],
  },
];

const defaultProps = {
  categories,
  activeToolId: undefined,
  onSelectTool: jest.fn(),
  onHome: jest.fn(),
};

describe("Sidebar", () => {
  it("renders the DevTools home button", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByRole("button", { name: "DevTools" })).toBeInTheDocument();
  });

  it("calls onHome when the DevTools button is clicked", () => {
    const onHome = jest.fn();
    render(<Sidebar {...defaultProps} onHome={onHome} />);
    fireEvent.click(screen.getByRole("button", { name: "DevTools" }));
    expect(onHome).toHaveBeenCalledTimes(1);
  });

  it("renders a row for each category", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Configuration" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connectivity" })).toBeInTheDocument();
  });

  it("collapses all categories by default", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Configuration" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("expands a category when its header is clicked", () => {
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByText("Feature Flags")).toBeInTheDocument();
  });

  it("collapses an expanded category on second click", () => {
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.queryByText("Feature Flags")).not.toBeInTheDocument();
  });

  it("auto-expands the category matching activeToolId", () => {
    render(<Sidebar {...defaultProps} activeToolId="feature-flags" />);
    expect(screen.getByText("Feature Flags")).toBeInTheDocument();
  });

  describe("search", () => {
    it("filters categories to those with matching tools", () => {
      render(<Sidebar {...defaultProps} />);
      fireEvent.change(screen.getByTestId("devtools-search"), { target: { value: "network" } });
      expect(screen.queryByRole("button", { name: "Configuration" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Connectivity" })).toBeInTheDocument();
    });

    it("expands all matching categories when search is active", () => {
      render(<Sidebar {...defaultProps} />);
      fireEvent.change(screen.getByTestId("devtools-search"), { target: { value: "f" } });
      expect(screen.getByText("Feature Flags")).toBeInTheDocument();
    });

    it("shows the no-match message when nothing matches", () => {
      render(<Sidebar {...defaultProps} />);
      fireEvent.change(screen.getByTestId("devtools-search"), { target: { value: "xyz" } });
      expect(screen.getByText(/no tools match/i)).toBeInTheDocument();
    });
  });
});
