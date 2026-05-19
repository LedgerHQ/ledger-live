import { render, screen } from "jest/render";
import { ToolRowItem } from "./ToolRowItem.web";
import { makeTool } from "jest/fixtures";
import { DevToolsProvider } from "../../context";
import { Category } from "@devtools/core";

const optionalTool = makeTool({
  id: "optional-tool",
  label: "Optional Tool",
  category: Category.DEBUGGING,
});

const requiredPropsTool = makeTool({
  id: "test-tool",
  label: "Test Tool",
  category: Category.CONFIGURATION,
  optional: false,
});

describe("ToolRowItem", () => {
  it("is enabled for an optional tool even when no props are provided", () => {
    render(<ToolRowItem tool={optionalTool} isActive={false} onSelect={jest.fn()} />);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-disabled", "true");
  });

  it("is disabled for a required-props tool when no props are provided", () => {
    render(<ToolRowItem tool={requiredPropsTool} isActive={false} onSelect={jest.fn()} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Test Tool").closest("[aria-disabled='true']")).not.toBeNull();
  });

  it("is enabled for a required-props tool when its props are provided", () => {
    render(
      <DevToolsProvider value={{ "test-tool": { value: "x" } }}>
        <ToolRowItem tool={requiredPropsTool} isActive={false} onSelect={jest.fn()} />
      </DevToolsProvider>,
    );
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-disabled", "true");
  });
});
