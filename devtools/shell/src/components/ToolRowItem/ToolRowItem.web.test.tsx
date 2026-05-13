import { render, screen } from "jest/render";
import "../../../jest/fixtures";
import { ToolRowItem } from "./ToolRowItem.web";
import { registerTool } from "../../registry/tools";
import { Category } from "../../types";
import { makeTool } from "../../../jest/fixtures";
import { DevToolsProvider } from "../../context";

const standaloneTool = makeTool({
  id: "standalone-tool",
  label: "Standalone Tool",
  category: Category.DEBUGGING,
});

const registryTool = registerTool({
  id: "test-tool",
  label: "Test Tool",
  category: Category.CONFIGURATION,
  component: () => null,
});

describe("ToolRowItem", () => {
  it("is enabled for a standalone tool even when no props are provided", () => {
    render(<ToolRowItem tool={standaloneTool} isActive={false} onSelect={jest.fn()} />);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-disabled", "true");
  });

  it("is disabled for a registry tool when no props are provided", () => {
    render(<ToolRowItem tool={registryTool} isActive={false} onSelect={jest.fn()} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Test Tool").closest("[aria-disabled='true']")).not.toBeNull();
  });

  it("is enabled for a registry tool when its props are provided", () => {
    render(
      <DevToolsProvider value={{ "test-tool": { value: "x" } }}>
        <ToolRowItem tool={registryTool} isActive={false} onSelect={jest.fn()} />
      </DevToolsProvider>,
    );
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-disabled", "true");
  });
});
