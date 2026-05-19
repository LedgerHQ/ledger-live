import userEvent from "@testing-library/user-event";
import { render, screen } from "jest/render";
import { makeTool } from "jest/fixtures";
import { ToolCard } from "./ToolCard.web";
import { Category } from "../../types";

const tool = makeTool({
  id: "feature-flags",
  label: "Feature Flags",
  category: Category.CONFIGURATION,
});

describe("ToolCard", () => {
  it("renders the tool label", () => {
    render(<ToolCard tool={tool} onSelect={jest.fn()} />);
    expect(screen.getByText("Feature Flags")).toBeInTheDocument();
  });

  it("renders the category name", () => {
    render(<ToolCard tool={tool} onSelect={jest.fn()} />);
    expect(screen.getByText("Configuration")).toBeInTheDocument();
  });

  it("calls onSelect with the tool id when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(<ToolCard tool={tool} onSelect={onSelect} />);
    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith("feature-flags");
  });
});
