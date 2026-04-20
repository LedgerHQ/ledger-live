import { fireEvent, render, screen } from "@testing-library/react-native";
import { DevTools } from "../DevTools.native";

describe("DevTools (native)", () => {
  it("renders the shell with nav and content area", () => {
    render(<DevTools />);
    expect(screen.getByTestId("devtools")).toBeOnTheScreen();
    expect(screen.getByTestId("devtools-nav")).toBeOnTheScreen();
  });

  it("shows categories in the sidebar", () => {
    render(<DevTools />);
    expect(screen.getByRole("button", { name: "Dev Tools" })).toBeOnTheScreen();
  });

  it("collapses all categories by default", () => {
    render(<DevTools />);
    expect(screen.queryByRole("button", { name: "Feature Flags" })).toBeNull();
  });

  it("shows empty state when no tool is selected", () => {
    render(<DevTools />);
    expect(screen.getByTestId("devtools-empty")).toBeOnTheScreen();
  });

  it("expands a category when pressed", () => {
    render(<DevTools />);
    fireEvent.press(screen.getByRole("button", { name: "Dev Tools" }));
    expect(screen.getByRole("button", { name: "Feature Flags" })).toBeOnTheScreen();
  });

  it("collapses an expanded category on second press", () => {
    render(<DevTools />);
    const categoryButton = screen.getByRole("button", { name: "Dev Tools" });
    fireEvent.press(categoryButton);
    fireEvent.press(categoryButton);
    expect(screen.queryByRole("button", { name: "Feature Flags" })).toBeNull();
  });

  it("navigates to a tool after expanding its category", () => {
    render(<DevTools />);
    fireEvent.press(screen.getByRole("button", { name: "Dev Tools" }));
    fireEvent.press(screen.getByRole("button", { name: "Feature Flags" }));
    expect(screen.queryByTestId("devtools-empty")).toBeNull();
    expect(screen.getByTestId("devtools-content")).toHaveTextContent(/Feature Flags/);
  });
});
