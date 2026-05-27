import { render, screen } from "jest/render";
import { ToolRowItem } from "./ToolRowItem.web";
import { makeTool } from "jest/fixtures";
import { Category } from "@devtools/registry";

const tool = makeTool({
  id: "test-tool",
  label: "Test Tool",
  category: Category.CONFIGURATION,
});

describe("ToolRowItem", () => {
  it("renders the tool label", () => {
    render(<ToolRowItem tool={tool} isActive={false} onSelect={jest.fn()} />);
    expect(screen.getByText("Test Tool")).toBeInTheDocument();
  });

  it("calls onSelect when clicked", () => {
    const onSelect = jest.fn();
    render(<ToolRowItem tool={tool} isActive={false} onSelect={onSelect} />);
    screen.getByRole("button").click();
    expect(onSelect).toHaveBeenCalled();
  });
});
