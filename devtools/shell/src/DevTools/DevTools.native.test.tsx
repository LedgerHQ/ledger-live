import { render, screen, userEvent } from "jest/render.native";
import { DevTools } from "./DevTools.native";
import { mockDevToolsConfig } from "jest/test-utils";

jest.mock("@devtools/registry", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const actual = jest.requireActual("@devtools/registry");
  return {
    ...actual,
    tools: {
      "test-tool": {
        label: "Test Tool",
        category: actual.Category.CONFIGURATION,
        loader: () => Promise.resolve({ default: () => null }),
      },
    },
  };
});

const config = mockDevToolsConfig([{ id: "test-tool", config: { value: "x" } }]);

describe("DevTools (native)", () => {
  it("renders the shell", () => {
    render(<DevTools config={config} />);
    expect(screen.getByTestId("devtools")).toBeOnTheScreen();
  });

  it("shows category list on the home screen", () => {
    render(<DevTools config={config} />);
    expect(screen.getByTestId("devtools-home")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Configuration" })).toBeOnTheScreen();
  });

  it("shows no tool screen when on home", () => {
    render(<DevTools config={config} />);
    expect(screen.queryByTestId("devtools-content")).toBeNull();
  });

  it("tapping a category shows its tools", async () => {
    const user = userEvent.setup();
    render(<DevTools config={config} />);
    await user.press(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Test Tool" })).toBeOnTheScreen();
  });

  it("tapping back from category returns to home", async () => {
    const user = userEvent.setup();
    render(<DevTools config={config} />);
    await user.press(screen.getByRole("button", { name: "Configuration" }));
    await user.press(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByTestId("devtools-home")).toBeOnTheScreen();
  });

  it("tapping a tool shows the tool screen", async () => {
    const user = userEvent.setup();
    render(<DevTools config={config} />);
    await user.press(screen.getByRole("button", { name: "Configuration" }));
    await user.press(screen.getByRole("button", { name: "Test Tool" }));
    expect(screen.getByTestId("devtools-content")).toBeOnTheScreen();
    expect(screen.getByTestId("devtools-content")).toHaveTextContent(/Test Tool/);
  });
});
