import { renderWithNavigation, screen, userEvent } from "jest/render.native";

import { DevTools } from "./DevTools.native";
import { mockDevToolsConfig } from "jest/test-utils";

jest.mock("@devtools/registry", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const actual = jest.requireActual("@devtools/registry");
  return {
    ...actual,
    tools: {
      "native-tool": {
        label: "Native Tool",
        category: actual.Category.CONFIGURATION,
        platform: "native",
        loader: () => Promise.resolve({ default: () => null }),
      },
      "web-tool": {
        label: "Web Tool",
        category: actual.Category.CONFIGURATION,
        platform: "web",
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
  { id: "native-tool", config: {} },
  { id: "web-tool", config: {} },
  { id: "shared-tool", config: {} },
]);

describe("DevTools (native) — platform filtering", () => {
  it("shows native-only tools", async () => {
    const user = userEvent.setup();
    renderWithNavigation(<DevTools config={config} />);
    await user.press(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Native Tool" })).toBeOnTheScreen();
  });

  it("hides web-only tools", async () => {
    const user = userEvent.setup();
    renderWithNavigation(<DevTools config={config} />);
    await user.press(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.queryByRole("button", { name: "Web Tool" })).toBeNull();
  });

  it("shows tools with no platform restriction", async () => {
    const user = userEvent.setup();
    renderWithNavigation(<DevTools config={config} />);
    await user.press(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Shared Tool" })).toBeOnTheScreen();
  });
});
