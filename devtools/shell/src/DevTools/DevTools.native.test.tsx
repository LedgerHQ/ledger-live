import { renderWithNavigation, screen, userEvent } from "jest/render.native";
import { mockDevToolsConfig } from "../../jest/test-utils";
import { DevTools } from "./DevTools.native";

jest.mock("@devtools/registry", () => {
  const actual = jest.requireActual("@devtools/registry");
  return {
    ...actual,
    tools: {
      "feature-flags": {
        label: "Feature Flags",
        owner: "wallet",
        category: actual.Category.CONFIGURATION,
        loader: () => Promise.resolve({ default: () => null }),
      },
      "env-editor": {
        label: "Env Editor",
        owner: "platform",
        category: actual.Category.CONFIGURATION,
        loader: () => Promise.resolve({ default: () => null }),
      },
      "network-inspector": {
        label: "Network Inspector",
        owner: "connectivity",
        category: actual.Category.DEBUGGING,
        loader: () => Promise.resolve({ default: () => null }),
      },
    },
  };
});

const config = mockDevToolsConfig([
  { id: "feature-flags", config: {} },
  { id: "env-editor", config: {} },
  { id: "network-inspector", config: {} },
]);

describe("DevTools (native) — navigation", () => {
  it("lists tool categories on the root screen", () => {
    renderWithNavigation(<DevTools config={config} />);
    expect(screen.getByRole("button", { name: "Configuration" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Debugging" })).toBeOnTheScreen();
  });

  it("drills into a category to reveal its tools", async () => {
    const user = userEvent.setup();
    renderWithNavigation(<DevTools config={config} />);
    await user.press(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Feature Flags" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Env Editor" })).toBeOnTheScreen();
  });
});

describe("DevTools (native) — search", () => {
  it("filters categories down to those with a matching tool", async () => {
    const user = userEvent.setup();
    renderWithNavigation(<DevTools config={config} />);
    await user.type(screen.getByPlaceholderText("Search tools"), "Feature");
    expect(screen.getByRole("button", { name: "Configuration" })).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Debugging" })).toBeNull();
  });

  it("carries the query into the category screen and filters its tools", async () => {
    const user = userEvent.setup();
    renderWithNavigation(<DevTools config={config} />);
    await user.type(screen.getByPlaceholderText("Search tools"), "Feature");
    await user.press(screen.getByRole("button", { name: "Configuration" }));
    expect(screen.getByRole("button", { name: "Feature Flags" })).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Env Editor" })).toBeNull();
  });
});
