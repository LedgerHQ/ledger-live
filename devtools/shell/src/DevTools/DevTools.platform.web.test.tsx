import { fireEvent, render, screen } from "@testing-library/react";
import { DevTools } from "./DevTools.web";

jest.mock("../registry/useResolvedTools", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { makeTool } = require("jest/fixtures");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Category } = require("@devtools/core");
  const tools = [
    makeTool({
      id: "web-tool",
      label: "Web Tool",
      category: Category.CONFIGURATION,
      platform: "web",
    }),
    makeTool({
      id: "native-tool",
      label: "Native Tool",
      category: Category.CONFIGURATION,
      platform: "native",
    }),
    makeTool({ id: "shared-tool", label: "Shared Tool", category: Category.CONFIGURATION }),
  ];
  return { useResolvedTools: () => ({ tools, failures: [] }) };
});

const toolLoaders = {
  "web-tool": () => Promise.resolve({}),
  "native-tool": () => Promise.resolve({}),
  "shared-tool": () => Promise.resolve({}),
};

describe("DevTools (web) — platform filtering", () => {
  it("shows web-only tools", () => {
    render(<DevTools toolLoaders={toolLoaders} />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Web Tool" })).toBeInTheDocument();
  });

  it("hides native-only tools", () => {
    render(<DevTools toolLoaders={toolLoaders} />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.queryByRole("button", { name: "Native Tool" })).not.toBeInTheDocument();
  });

  it("shows tools with no platform restriction", () => {
    render(<DevTools toolLoaders={toolLoaders} />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Shared Tool" })).toBeInTheDocument();
  });
});
