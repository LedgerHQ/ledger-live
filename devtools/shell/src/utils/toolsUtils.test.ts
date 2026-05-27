import { Category } from "@devtools/registry";
import { filterToolsByQuery, findCategoryForToolId } from "../utils/toolsUtils";
import { makeTool } from "jest/fixtures";

const categories = [
  {
    category: Category.CONFIGURATION,
    tools: [
      makeTool({ id: "feature-flags", label: "Feature Flags", category: Category.CONFIGURATION }),
      makeTool({
        id: "env-switcher",
        label: "Env Switcher",
        category: Category.CONFIGURATION,
        owner: "platform",
      }),
    ],
  },
  {
    category: Category.CONNECTIVITY,
    tools: [
      makeTool({
        id: "network-inspector",
        label: "Network Inspector",
        category: Category.CONNECTIVITY,
        owner: "wallet-api",
      }),
    ],
  },
];

describe("filterToolsByQuery", () => {
  it("returns all categories unchanged when query is empty", () => {
    expect(filterToolsByQuery(categories, "")).toBe(categories);
  });

  it("returns all categories unchanged when query is whitespace only", () => {
    expect(filterToolsByQuery(categories, "   ")).toBe(categories);
  });

  it("filters tools by label (case-insensitive)", () => {
    const result = filterToolsByQuery(categories, "feature");
    expect(result).toHaveLength(1);
    expect(result[0].tools.map(t => t.id)).toEqual(["feature-flags"]);
  });

  it("filters tools by owner (case-insensitive)", () => {
    const result = filterToolsByQuery(categories, "wallet-api");
    expect(result).toHaveLength(1);
    expect(result[0].tools.map(t => t.id)).toEqual(["network-inspector"]);
  });

  it("keeps the category when at least one tool matches", () => {
    const result = filterToolsByQuery(categories, "env");
    expect(result[0].category).toBe(Category.CONFIGURATION);
    expect(result[0].tools).toHaveLength(1);
  });

  it("drops categories with no matching tools", () => {
    const result = filterToolsByQuery(categories, "feature");
    const categories_ = result.map(c => c.category);
    expect(categories_).not.toContain(Category.CONNECTIVITY);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterToolsByQuery(categories, "zzznomatch")).toHaveLength(0);
  });

  it("matches across multiple categories", () => {
    const result = filterToolsByQuery(categories, "inspector");
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe(Category.CONNECTIVITY);
  });
});

describe("findCategoryForToolId", () => {
  it("returns null when toolId is undefined", () => {
    expect(findCategoryForToolId(categories, undefined)).toBeNull();
  });

  it("returns the correct category for a known tool id", () => {
    expect(findCategoryForToolId(categories, "network-inspector")).toBe(
      Category.CONNECTIVITY,
    );
    expect(findCategoryForToolId(categories, "feature-flags")).toBe(Category.CONFIGURATION);
  });

  it("returns null for an unknown tool id", () => {
    expect(findCategoryForToolId(categories, "does-not-exist")).toBeNull();
  });
});
