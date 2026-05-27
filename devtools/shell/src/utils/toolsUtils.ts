import type { Category, Tool, ToolId, ToolPlatform } from "@devtools/registry";

type CategoryEntry = { category: Category; tools: Tool[] };

export function filterToolsByPlatform(tools: Tool[], platform: ToolPlatform): Tool[] {
  return tools.filter(t => !t.platform || t.platform === platform);
}

export function filterToolsByQuery(categories: CategoryEntry[], query: string): CategoryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return categories;
  return categories.reduce<CategoryEntry[]>((acc, { category, tools }) => {
    const matched = tools.filter(
      t => t.label.toLowerCase().includes(q) || (t.owner ?? "").toLowerCase().includes(q),
    );
    if (matched.length > 0) acc.push({ category, tools: matched });
    return acc;
  }, []);
}

export function findCategoryForToolId(
  categories: CategoryEntry[],
  toolId: ToolId | undefined,
): Category | null {
  if (!toolId) return null;
  return categories.find(({ tools }) => tools.some(t => t.id === toolId))?.category ?? null;
}
