import { render, screen, userEvent } from "jest/render.native";
import { DevTools } from "./DevTools.native";

jest.mock("../registry/useResolvedTools", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { makeTool } = require("jest/fixtures");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Category } = require("../types");
  const tools = [
    makeTool({ id: "test-tool", label: "Test Tool", category: Category.CONFIGURATION }),
  ];
  return { useResolvedTools: () => ({ tools, failures: [] }) };
});

const toolLoaders = { "test-tool": () => Promise.resolve({}) };

describe("DevTools (native)", () => {
  it("renders the shell", () => {
    render(<DevTools toolLoaders={toolLoaders} />);
    expect(screen.getByTestId("devtools")).toBeOnTheScreen();
  });

  it("shows category list on the home screen", () => {
    render(<DevTools toolLoaders={toolLoaders} />);
    expect(screen.getByTestId("devtools-home")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Configuration" })).toBeOnTheScreen();
  });

  it("shows no tool screen when on home", () => {
    render(<DevTools toolLoaders={toolLoaders} />);
    expect(screen.queryByTestId("devtools-content")).toBeNull();
  });

  it("tapping a category shows its tools", async () => {
    const user = userEvent.setup();
    render(<DevTools toolLoaders={toolLoaders} />);
    await user.press(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Test Tool" })).toBeOnTheScreen();
  });

  it("tapping back from category returns to home", async () => {
    const user = userEvent.setup();
    render(<DevTools toolLoaders={toolLoaders} />);
    await user.press(screen.getByRole("button", { name: "Configuration" }));
    await user.press(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByTestId("devtools-home")).toBeOnTheScreen();
  });

  it("tapping a tool shows the tool screen", async () => {
    const user = userEvent.setup();
    render(<DevTools toolLoaders={toolLoaders} toolProps={{ "test-tool": { value: "x" } }} />);
    await user.press(screen.getByRole("button", { name: "Configuration" }));
    await user.press(screen.getByRole("button", { name: "Test Tool" }));
    expect(screen.getByTestId("devtools-content")).toBeOnTheScreen();
    expect(screen.getByTestId("devtools-content")).toHaveTextContent(/Test Tool/);
  });
});
