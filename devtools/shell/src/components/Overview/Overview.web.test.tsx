import userEvent from "@testing-library/user-event";
import { render, screen } from "jest/render";
import { makeTool } from "jest/fixtures";
import { Overview } from "./Overview.web";
import { Category } from "@devtools/registry";

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

describe("Overview", () => {
  it("renders the heading", () => {
    render(<Overview categories={categories} recentToolIds={[]} onSelect={jest.fn()} />);
    expect(screen.getByRole("heading", { name: /what do you need/i })).toBeInTheDocument();
  });

  it("renders a card for each category", () => {
    render(<Overview categories={categories} recentToolIds={[]} onSelect={jest.fn()} />);
    expect(screen.getByText("Configuration")).toBeInTheDocument();
    expect(screen.getByText("Connectivity")).toBeInTheDocument();
  });

  it("does not render the Recent section when recentToolIds is empty", () => {
    render(<Overview categories={categories} recentToolIds={[]} onSelect={jest.fn()} />);
    expect(screen.queryByText("Recent")).not.toBeInTheDocument();
  });

  it("renders the Recent section when recentToolIds contains known tool ids", () => {
    render(
      <Overview categories={categories} recentToolIds={["feature-flags"]} onSelect={jest.fn()} />,
    );
    expect(screen.getByText("Recent")).toBeInTheDocument();
    expect(screen.getByText("Feature Flags")).toBeInTheDocument();
  });

  it("calls onSelect with the first tool id when a category card is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(<Overview categories={categories} recentToolIds={[]} onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: /configuration/i }));
    expect(onSelect).toHaveBeenCalledWith("feature-flags");
  });

  it("calls onSelect with the tool id when a recent tool card is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(
      <Overview
        categories={categories}
        recentToolIds={["network-inspector"]}
        onSelect={onSelect}
      />,
    );
    await user.click(screen.getByRole("button", { name: /network inspector/i }));
    expect(onSelect).toHaveBeenCalledWith("network-inspector");
  });
});
