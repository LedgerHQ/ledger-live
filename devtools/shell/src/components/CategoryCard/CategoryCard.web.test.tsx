import userEvent from "@testing-library/user-event";
import { render, screen } from "jest/render";
import { makeTool } from "jest/fixtures";
import { CategoryCard } from "./CategoryCard.web";
import { Category } from "@devtools/registry";
import type { Tool } from "@devtools/registry";

const tool = makeTool({
  id: "feature-flags",
  label: "Feature Flags",
  category: Category.CONFIGURATION,
});

describe("CategoryCard", () => {
  it("renders the category name", () => {
    render(<CategoryCard category={Category.CONFIGURATION} tools={[tool]} onSelect={jest.fn()} />);
    expect(screen.getByText("Configuration")).toBeInTheDocument();
  });

  it("shows singular 'tool' for a single tool", () => {
    render(<CategoryCard category={Category.CONFIGURATION} tools={[tool]} onSelect={jest.fn()} />);
    expect(screen.getByText("1 tool")).toBeInTheDocument();
  });

  it("shows plural 'tools' for multiple tools", () => {
    const tools: Tool[] = [tool, { ...tool, id: "other" }];
    render(<CategoryCard category={Category.CONFIGURATION} tools={tools} onSelect={jest.fn()} />);
    expect(screen.getByText("2 tools")).toBeInTheDocument();
  });

  it("calls onSelect with the first tool id when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(<CategoryCard category={Category.CONFIGURATION} tools={[tool]} onSelect={onSelect} />);
    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith("feature-flags");
  });

  it("does not call onSelect when tools is empty", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(<CategoryCard category={Category.CONFIGURATION} tools={[]} onSelect={onSelect} />);
    await user.click(screen.getByRole("button"));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
