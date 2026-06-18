import { renderScreen, screen, userEvent } from "jest/render.native";
import { Category } from "@devtools/registry";
import { makeTool } from "jest/fixtures";
import { CategoriesScreen } from "./CategoriesScreen.native";

const categories = [
  {
    category: Category.CONFIGURATION,
    tools: [
      makeTool({ id: "feature-flags", label: "Feature Flags", category: Category.CONFIGURATION }),
      makeTool({ id: "env-editor", label: "Env Editor", category: Category.CONFIGURATION }),
    ],
  },
  {
    category: Category.DEBUGGING,
    tools: [
      makeTool({
        id: "network-inspector",
        label: "Network Inspector",
        category: Category.DEBUGGING,
      }),
    ],
  },
];

describe("CategoriesScreen (native)", () => {
  it("renders a row for each category", () => {
    renderScreen(CategoriesScreen, { categories });
    expect(screen.getByRole("button", { name: "Configuration" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Debugging" })).toBeOnTheScreen();
  });

  it("sets the navigation title", () => {
    const { navigation } = renderScreen(CategoriesScreen, { categories });
    expect(navigation.setOptions).toHaveBeenCalledWith({ title: "DevTools" });
  });

  it("drills into the pressed category", async () => {
    const user = userEvent.setup();
    const { navigation } = renderScreen(CategoriesScreen, { categories });
    await user.press(screen.getByRole("button", { name: "Configuration" }));
    expect(navigation.push).toHaveBeenCalledWith("tools", { category: Category.CONFIGURATION });
  });

  it("filters categories down to those with a matching tool", async () => {
    const user = userEvent.setup();
    renderScreen(CategoriesScreen, { categories });
    await user.type(screen.getByPlaceholderText("Search tools"), "Network");
    expect(screen.getByRole("button", { name: "Debugging" })).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Configuration" })).toBeNull();
  });
});
