import userEvent from "@testing-library/user-event";
import { render, screen } from "jest/render";
import { makeTool } from "jest/fixtures";
import { ToolShell } from "./ToolShell.web";
import { Category } from "../../types";

const baseTool = makeTool({
  id: "feature-flags",
  label: "Feature Flags",
  category: Category.CONFIGURATION,
});

describe("ToolShell", () => {
  it("renders the tool label", () => {
    render(<ToolShell tool={baseTool} onBack={jest.fn()} />);
    expect(screen.getByRole("heading", { name: "Feature Flags" })).toBeInTheDocument();
  });

  it("calls onBack when the breadcrumb is clicked", async () => {
    const user = userEvent.setup();
    const onBack = jest.fn();
    render(<ToolShell tool={baseTool} onBack={onBack} />);
    await user.click(screen.getByRole("button", { name: "Configuration / feature-flags" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders the description when provided", () => {
    render(<ToolShell tool={{ ...baseTool, desc: "Manage feature flags" }} onBack={jest.fn()} />);
    expect(screen.getByText("Manage feature flags")).toBeInTheDocument();
  });

  it("renders the owner tag when provided", () => {
    render(<ToolShell tool={{ ...baseTool, owner: "wallet-api" }} onBack={jest.fn()} />);
    expect(screen.getByText("wallet-api")).toBeInTheDocument();
  });
});
