import { fireEvent, render, screen } from "@testing-library/react";
import { DevTools } from "../DevTools.web";

beforeEach(() => {
  localStorage.clear();
});

describe("DevTools (web)", () => {
  it("renders the shell with nav and content area", () => {
    render(<DevTools />);
    expect(screen.getByTestId("devtools")).toBeInTheDocument();
    expect(screen.getByTestId("devtools-nav")).toBeInTheDocument();
  });

  it("shows only non-empty categories in the sidebar", () => {
    render(<DevTools />);
    expect(screen.getByRole("button", { name: "Configuration" })).toBeInTheDocument();
  });

  it("collapses all categories by default", () => {
    render(<DevTools />);
    expect(screen.queryByRole("button", { name: "Feature Flags" })).not.toBeInTheDocument();
  });

  it("shows empty state when no tool is selected", () => {
    render(<DevTools />);
    expect(screen.getByTestId("devtools-empty")).toBeInTheDocument();
  });

  it("expands a category when clicked", () => {
    render(<DevTools />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Feature Flags" })).toBeInTheDocument();
  });

  it("collapses an expanded category on second click", () => {
    render(<DevTools />);
    const categoryButton = screen.getByRole("button", { name: "Configuration" });
    fireEvent.click(categoryButton);
    fireEvent.click(categoryButton);
    expect(screen.queryByRole("button", { name: "Feature Flags" })).not.toBeInTheDocument();
  });

  it("single-expand: opening a second category collapses the first", () => {
    render(<DevTools />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Feature Flags" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Connectivity" }));
    expect(screen.queryByRole("button", { name: "Feature Flags" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Network Inspector" })).toBeInTheDocument();
  });

  it("navigates to a tool after expanding its category", () => {
    render(<DevTools />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    fireEvent.click(screen.getByRole("button", { name: "Feature Flags" }));
    expect(screen.queryByTestId("devtools-empty")).not.toBeInTheDocument();
    expect(screen.getByTestId("devtools-content")).toHaveTextContent("Feature Flags");
  });

  it("shows the internal tools warning strip", () => {
    render(<DevTools />);
    expect(screen.getByText(/Internal tools/)).toBeInTheDocument();
  });
});
