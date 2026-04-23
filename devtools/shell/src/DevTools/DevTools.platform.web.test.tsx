import { fireEvent, render, screen } from "@testing-library/react";
import { makeTool } from "../../jest/fixtures";
import { DevTools } from "../DevTools/DevTools.web";

jest.mock("../tools.config", () => ({
  TOOLS: [
    makeTool({ id: "web-tool", label: "Web Tool", category: "Configuration", platform: "web" }),
    makeTool({ id: "native-tool", label: "Native Tool", category: "Configuration", platform: "native" }),
    makeTool({ id: "shared-tool", label: "Shared Tool", category: "Configuration" }),
  ],
}));

describe("DevTools (web) — platform filtering", () => {
  it("shows web-only tools", () => {
    render(<DevTools />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Web Tool" })).toBeInTheDocument();
  });

  it("hides native-only tools", () => {
    render(<DevTools />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.queryByRole("button", { name: "Native Tool" })).not.toBeInTheDocument();
  });

  it("shows tools with no platform restriction", () => {
    render(<DevTools />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Shared Tool" })).toBeInTheDocument();
  });
});
