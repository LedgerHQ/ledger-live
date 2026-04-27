import { fireEvent, render, screen } from "@testing-library/react";
import { ToolRow } from "../../components/ToolRow.web";

describe("ToolRow", () => {
  it("renders the title", () => {
    render(<ToolRow title="Feature Flags" />);
    expect(screen.getByText("Feature Flags")).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(<ToolRow title="Feature Flags" description="Toggle feature flags" />);
    expect(screen.getByText("Toggle feature flags")).toBeInTheDocument();
  });

  it("does not render a description when absent", () => {
    render(<ToolRow title="Feature Flags" />);
    expect(screen.queryByText("Toggle feature flags")).not.toBeInTheDocument();
  });

  it("renders the owner tag when provided", () => {
    render(<ToolRow title="Feature Flags" owner="Platform" />);
    expect(screen.getByText("Platform")).toBeInTheDocument();
  });

  it("does not render an owner tag when absent", () => {
    render(<ToolRow title="Feature Flags" />);
    expect(screen.queryByText("Platform")).not.toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    render(<ToolRow title="Feature Flags" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("sets aria-current to page when active", () => {
    render(<ToolRow title="Feature Flags" isActive={true} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-current", "page");
  });

  it("does not set aria-current when inactive", () => {
    render(<ToolRow title="Feature Flags" isActive={false} />);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-current");
  });
});
