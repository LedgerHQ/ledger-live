import { fireEvent, render, screen } from "@testing-library/react";
import { ToolCard } from "../../components/ToolCard";
import { Category } from "../../types";

const tool = { id: "feature-flags", label: "Feature Flags", category: Category.CONFIGURATION };

describe("ToolCard", () => {
  it("renders the tool label", () => {
    render(<ToolCard tool={tool} onSelect={jest.fn()} />);
    expect(screen.getByText("Feature Flags")).toBeInTheDocument();
  });

  it("renders the category name", () => {
    render(<ToolCard tool={tool} onSelect={jest.fn()} />);
    expect(screen.getByText("Configuration")).toBeInTheDocument();
  });

  it("calls onSelect with the tool id when clicked", () => {
    const onSelect = jest.fn();
    render(<ToolCard tool={tool} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith("feature-flags");
  });
});
