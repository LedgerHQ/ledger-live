import { render, screen } from "jest/render";
import { ToolRowItem } from "./ToolRowItem.web";
import { registerTool, registerToolWithRequiredProps } from "../../registry/tools";
import { Category } from "../../types";
import { DevToolsProvider } from "../../context";

const optionalTool = registerTool({
  id: "optional-tool",
  label: "Optional Tool",
  category: Category.DEBUGGING,
  component: () => null,
});

const requiredPropsTool = registerToolWithRequiredProps({
  id: "test-tool",
  label: "Test Tool",
  category: Category.CONFIGURATION,
  component: () => null,
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
