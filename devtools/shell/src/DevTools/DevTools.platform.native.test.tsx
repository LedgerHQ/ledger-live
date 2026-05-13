import { fireEvent, render, screen } from "@testing-library/react-native";
import { makeTool } from "../../jest/fixtures";
import { DevTools } from "../DevTools/DevTools.native";
import { registerStandaloneTool } from "../registry/tools";
import { Category } from "../types";

registerStandaloneTool(
  makeTool({
    id: "native-tool",
    label: "Native Tool",
    category: Category.CONFIGURATION,
    platform: "native",
  }),
);
registerStandaloneTool(
  makeTool({
    id: "web-tool",
    label: "Web Tool",
    category: Category.CONFIGURATION,
    platform: "web",
  }),
);
registerStandaloneTool(
  makeTool({
    id: "shared-tool",
    label: "Shared Tool",
    category: Category.CONFIGURATION,
  }),
);

describe("DevTools (native) — platform filtering", () => {
  it("shows native-only tools", () => {
    render(<DevTools />);
    fireEvent.press(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Native Tool" })).toBeOnTheScreen();
  });

  it("hides web-only tools", () => {
    render(<DevTools />);
    fireEvent.press(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.queryByRole("button", { name: "Web Tool" })).toBeNull();
  });

  it("shows tools with no platform restriction", () => {
    render(<DevTools />);
    fireEvent.press(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Shared Tool" })).toBeOnTheScreen();
  });
});
