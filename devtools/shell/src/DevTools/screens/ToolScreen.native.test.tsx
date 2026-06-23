import { Text } from "react-native";
import { renderScreen, screen } from "jest/render.native";
import { Category } from "@devtools/registry";
import { makeTool } from "jest/fixtures";
import { ToolScreen } from "./ToolScreen.native";

const categories = [
  {
    category: Category.CONFIGURATION,
    tools: [
      makeTool({
        id: "feature-flags",
        label: "Feature Flags",
        category: Category.CONFIGURATION,
        component: () => <Text>Feature Flags body</Text>,
      }),
    ],
  },
];

describe("ToolScreen (native)", () => {
  it("renders the selected tool's component", () => {
    renderScreen(ToolScreen, { categories, params: { toolId: "feature-flags" } });
    expect(screen.getByText("Feature Flags body")).toBeOnTheScreen();
  });

  it("sets the navigation title to the tool label", () => {
    const { navigation } = renderScreen(ToolScreen, {
      categories,
      params: { toolId: "feature-flags" },
    });
    expect(navigation.setOptions).toHaveBeenCalledWith({ title: "Feature Flags" });
  });

  it("renders nothing for an unknown tool id", () => {
    renderScreen(ToolScreen, { categories, params: { toolId: "does-not-exist" } });
    expect(screen.queryByText("Feature Flags body")).toBeNull();
  });
});
