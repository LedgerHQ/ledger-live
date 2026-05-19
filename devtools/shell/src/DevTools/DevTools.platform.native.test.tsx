import { fireEvent, render, screen } from "@testing-library/react-native";
import { DevTools } from "./DevTools.native";

jest.mock("../registry/useResolvedTools", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { makeTool } = require("jest/fixtures");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Category } = require("../types");
  const tools = [
    makeTool({
      id: "native-tool",
      label: "Native Tool",
      category: Category.CONFIGURATION,
      platform: "native",
    }),
    makeTool({
      id: "web-tool",
      label: "Web Tool",
      category: Category.CONFIGURATION,
      platform: "web",
    }),
    makeTool({ id: "shared-tool", label: "Shared Tool", category: Category.CONFIGURATION }),
  ];
  return { useResolvedTools: () => ({ tools, failures: [] }) };
});

const toolLoaders = {
  "native-tool": () => Promise.resolve({}),
  "web-tool": () => Promise.resolve({}),
  "shared-tool": () => Promise.resolve({}),
};

describe("DevTools (native) — platform filtering", () => {
  it("shows native-only tools", () => {
    render(<DevTools toolLoaders={toolLoaders} />);
    fireEvent.press(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Native Tool" })).toBeOnTheScreen();
  });

  it("hides web-only tools", () => {
    render(<DevTools toolLoaders={toolLoaders} />);
    fireEvent.press(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.queryByRole("button", { name: "Web Tool" })).toBeNull();
  });

  it("shows tools with no platform restriction", () => {
    render(<DevTools toolLoaders={toolLoaders} />);
    fireEvent.press(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Shared Tool" })).toBeOnTheScreen();
  });
});
