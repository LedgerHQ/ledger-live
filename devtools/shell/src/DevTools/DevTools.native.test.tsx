import { fireEvent, render, screen } from "jest/render.native";
import { DevTools } from "./DevTools.native";

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

  it("tapping a category shows its tools", () => {
    render(<DevTools />);
    fireEvent.press(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Feature Flags" })).toBeOnTheScreen();
  });

  it("tapping back from category returns to home", () => {
    render(<DevTools />);
    fireEvent.press(screen.getByRole("button", { name: "Configuration" }));
    fireEvent.press(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByTestId("devtools-home")).toBeOnTheScreen();
  });

  it("tapping a tool shows the tool screen", () => {
    render(<DevTools />);
    fireEvent.press(screen.getByRole("button", { name: "Configuration" }));
    fireEvent.press(screen.getByRole("button", { name: "Feature Flags" }));
    expect(screen.getByTestId("devtools-content")).toBeOnTheScreen();
    expect(screen.getByTestId("devtools-content")).toHaveTextContent(/Feature Flags/);
  });
});
