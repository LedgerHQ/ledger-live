import { render, screen, userEvent } from "jest/render.native";
import { registerTool } from "../registry/tools";
import { Category } from "../types";
import { DevTools } from "./DevTools.native";

registerTool({
  id: "test-tool",
  label: "Test Tool",
  category: Category.CONFIGURATION,
  component: () => null,
});

describe("DevTools (native)", () => {
  it("renders the shell", () => {
    render(<DevTools />);
    expect(screen.getByTestId("devtools")).toBeOnTheScreen();
  });

  it("shows category list on the home screen", () => {
    render(<DevTools />);
    expect(screen.getByTestId("devtools-home")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Configuration" })).toBeOnTheScreen();
  });

  it("shows no tool screen when on home", () => {
    render(<DevTools />);
    expect(screen.queryByTestId("devtools-content")).toBeNull();
  });

  it("tapping a category shows its tools", async () => {
    const user = userEvent.setup();
    render(<DevTools />);
    await user.press(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Test Tool" })).toBeOnTheScreen();
  });

  it("tapping back from category returns to home", async () => {
    const user = userEvent.setup();
    render(<DevTools />);
    await user.press(screen.getByRole("button", { name: "Configuration" }));
    await user.press(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByTestId("devtools-home")).toBeOnTheScreen();
  });

  it("tapping a tool shows the tool screen", async () => {
    const user = userEvent.setup();
    render(<DevTools toolProps={{ "test-tool": { value: "x" } }} />);
    await user.press(screen.getByRole("button", { name: "Configuration" }));
    await user.press(screen.getByRole("button", { name: "Test Tool" }));
    expect(screen.getByTestId("devtools-content")).toBeOnTheScreen();
    expect(screen.getByTestId("devtools-content")).toHaveTextContent(/Test Tool/);
  });
});
