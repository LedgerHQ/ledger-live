import { fireEvent, render, screen } from "@testing-library/react-native";
import { makeTool } from "../../jest/fixtures";
import { DevTools } from "../DevTools/DevTools.native";

jest.mock("../tools.config", () => ({
  TOOLS: [
    makeTool({ id: "web-tool", label: "Web Tool", category: "Configuration", platform: "web" }),
    makeTool({ id: "native-tool", label: "Native Tool", category: "Configuration", platform: "native" }),
    makeTool({ id: "shared-tool", label: "Shared Tool", category: "Configuration" }),
    makeTool({ id: "web-tool", label: "Web Tool", category: "Dev Tools", platform: "web" }),
    makeTool({ id: "native-tool", label: "Native Tool", category: "Dev Tools", platform: "native" }),
    makeTool({ id: "shared-tool", label: "Shared Tool", category: "Dev Tools" }),
  ],
}));

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
