import userEvent from "@testing-library/user-event";
import { render, screen } from "jest/render";
import { makeTool } from "jest/fixtures";
import { CategoryRow } from "./CategoryRow.web";
import { Category } from "../../types";
import { Settings } from "@ledgerhq/lumen-ui-react/symbols";

const tools = [
  makeTool({ id: "feature-flags", label: "Feature Flags", category: Category.CONFIGURATION }),
  makeTool({ id: "another-tool", label: "Another Tool", category: Category.CONFIGURATION }),
];

const defaultProps = {
  category: Category.CONFIGURATION,
  tools,
  icon: Settings,
  isExpanded: false,
  onToggle: jest.fn(),
  activeToolId: undefined,
  onSelectTool: jest.fn(),
};

describe("CategoryRow", () => {
  it("renders the category name", () => {
    render(<CategoryRow {...defaultProps} />);
    expect(screen.getByText("Configuration")).toBeInTheDocument();
  });

  it("renders the tool count", () => {
    render(<CategoryRow {...defaultProps} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("sets aria-expanded to false when collapsed", () => {
    render(<CategoryRow {...defaultProps} isExpanded={false} />);
    expect(screen.getByRole("button", { name: "Configuration" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("sets aria-expanded to true when expanded", () => {
    render(<CategoryRow {...defaultProps} isExpanded={true} />);
    expect(screen.getByRole("button", { name: "Configuration" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("calls onToggle when the header button is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    render(<CategoryRow {...defaultProps} onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: "Configuration" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("does not render tool rows when collapsed", () => {
    render(<CategoryRow {...defaultProps} isExpanded={false} />);
    expect(screen.queryByText("Feature Flags")).not.toBeInTheDocument();
  });

  it("renders a tool row for each tool when expanded", () => {
    render(<CategoryRow {...defaultProps} isExpanded={true} />);
    expect(screen.getByText("Feature Flags")).toBeInTheDocument();
    expect(screen.getByText("Another Tool")).toBeInTheDocument();
  });

  it("calls onSelectTool with the tool id when a tool row is clicked", async () => {
    const user = userEvent.setup();
    const onSelectTool = jest.fn();
    render(<CategoryRow {...defaultProps} isExpanded={true} onSelectTool={onSelectTool} />);
    await user.click(screen.getByText("Feature Flags"));
    expect(onSelectTool).toHaveBeenCalledWith("feature-flags");
  });
});
