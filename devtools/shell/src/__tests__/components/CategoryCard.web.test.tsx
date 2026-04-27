import { fireEvent, render, screen } from "@testing-library/react";
import { CategoryCard } from "../../components/CategoryCard.web";
import { Category } from "../../types";

const tool = { id: "feature-flags", label: "Feature Flags", category: Category.CONFIGURATION };

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
    const tools = [tool, { ...tool, id: "other" }];
    render(<CategoryCard category={Category.CONFIGURATION} tools={tools} onSelect={jest.fn()} />);
    expect(screen.getByText("2 tools")).toBeInTheDocument();
  });

  it("calls onSelect with the first tool id when clicked", () => {
    const onSelect = jest.fn();
    render(<CategoryCard category={Category.CONFIGURATION} tools={[tool]} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith("feature-flags");
  });

  it("does not call onSelect when tools is empty", () => {
    const onSelect = jest.fn();
    render(<CategoryCard category={Category.CONFIGURATION} tools={[]} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
