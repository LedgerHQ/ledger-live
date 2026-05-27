import { fireEvent, render, screen } from "@testing-library/react";
import { DevTools } from "./DevTools.web";
import { mockDevToolsConfig } from "../../jest/test-utils";

jest.mock("@devtools/registry", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const actual = jest.requireActual("@devtools/registry");
  return {
    ...actual,
    tools: {
      "web-tool": {
        label: "Web Tool",
        category: actual.Category.CONFIGURATION,
        platform: "web",
        loader: () => Promise.resolve({ default: () => null }),
      },
      "native-tool": {
        label: "Native Tool",
        category: actual.Category.CONFIGURATION,
        platform: "native",
        loader: () => Promise.resolve({ default: () => null }),
      },
      "shared-tool": {
        label: "Shared Tool",
        category: actual.Category.CONFIGURATION,
        loader: () => Promise.resolve({ default: () => null }),
      },
    },
  };
});

const config = mockDevToolsConfig([
  { id: "web-tool", config: {} },
  { id: "native-tool", config: {} },
  { id: "shared-tool", config: {} },
]);

describe("DevTools (web) — platform filtering", () => {
  it("shows web-only tools", () => {
    render(<DevTools config={config} />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Web Tool" })).toBeInTheDocument();
  });

  it("hides native-only tools", () => {
    render(<DevTools config={config} />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.queryByRole("button", { name: "Native Tool" })).not.toBeInTheDocument();
  });

  it("shows tools with no platform restriction", () => {
    render(<DevTools config={config} />);
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Shared Tool" })).toBeInTheDocument();
  });
});
