import { renderScreen, screen, userEvent } from "jest/render.native";
import { Category } from "@devtools/registry";
import { makeTool } from "jest/fixtures";
import { ToolsScreen } from "./ToolsScreen.native";

const categories = [
  {
    category: Category.CONFIGURATION,
    tools: [
      makeTool({ id: "feature-flags", label: "Feature Flags", category: Category.CONFIGURATION }),
      makeTool({ id: "env-editor", label: "Env Editor", category: Category.CONFIGURATION }),
    ],
  },
];

const params = { category: Category.CONFIGURATION };

describe("ToolsScreen (native)", () => {
  it("renders the tools of the route's category", () => {
    renderScreen(ToolsScreen, { categories, params });
    expect(screen.getByRole("button", { name: "Feature Flags" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Env Editor" })).toBeOnTheScreen();
  });

  it("sets the navigation title to the category", () => {
    const { navigation } = renderScreen(ToolsScreen, { categories, params });
    expect(navigation.setOptions).toHaveBeenCalledWith({ title: Category.CONFIGURATION });
  });

  it("opens the pressed tool", async () => {
    const user = userEvent.setup();
    const { navigation } = renderScreen(ToolsScreen, { categories, params });
    await user.press(screen.getByRole("button", { name: "Feature Flags" }));
    expect(navigation.push).toHaveBeenCalledWith("tool", { toolId: "feature-flags" });
  });

  it("filters the tools by query", async () => {
    const user = userEvent.setup();
    renderScreen(ToolsScreen, { categories, params });
    await user.type(screen.getByPlaceholderText("Search tools"), "Env");
    expect(screen.getByRole("button", { name: "Env Editor" })).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Feature Flags" })).toBeNull();
  });
});
