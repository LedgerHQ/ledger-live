import userEvent from "@testing-library/user-event";
import { render, screen } from "jest/render";
import { makeTool } from "jest/fixtures";
import { Sidebar } from "./Sidebar.web";
import { Category } from "../../types";

const categories = [
  {
    category: Category.CONFIGURATION,
    tools: [
      makeTool({ id: "feature-flags", label: "Feature Flags", category: Category.CONFIGURATION }),
    ],
  },
  {
    category: Category.CONNECTIVITY,
    tools: [
      makeTool({
        id: "network-inspector",
        label: "Network Inspector",
        category: Category.CONNECTIVITY,
      }),
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

  it("calls onHome when the DevTools button is clicked", async () => {
    const user = userEvent.setup();
    const onHome = jest.fn();
    render(<Sidebar {...defaultProps} onHome={onHome} />);
    await user.click(screen.getByRole("button", { name: "DevTools" }));
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

  it("expands a category when its header is clicked", async () => {
    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByText("Feature Flags")).toBeInTheDocument();
  });

  it("collapses an expanded category on second click", async () => {
    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: "Configuration" }));
    await user.click(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.queryByText("Feature Flags")).not.toBeInTheDocument();
  });

  it("auto-expands the category matching activeToolId", () => {
    render(<Sidebar {...defaultProps} activeToolId="feature-flags" />);
    expect(screen.getByText("Feature Flags")).toBeInTheDocument();
  });

  describe("search", () => {
    it("filters categories to those with matching tools", async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} />);
      await user.type(screen.getByTestId("devtools-search"), "network");
      expect(screen.queryByRole("button", { name: "Configuration" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Connectivity" })).toBeInTheDocument();
    });

    it("expands all matching categories when search is active", async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} />);
      await user.type(screen.getByTestId("devtools-search"), "f");
      expect(screen.getByText("Feature Flags")).toBeInTheDocument();
    });

    it("shows the no-match message when nothing matches", async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} />);
      await user.type(screen.getByTestId("devtools-search"), "xyz");
      expect(screen.getByText(/no tools match/i)).toBeInTheDocument();
    });
  });
});
