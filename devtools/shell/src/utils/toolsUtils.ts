import type { Category, Tool, ToolId, ToolPlatform } from "@devtools/registry";

type CategoryEntry = { category: Category; tools: Tool[] };

export function filterToolsByPlatform(tools: Tool[], platform: ToolPlatform): Tool[] {
  return tools.filter(t => !t.platform || t.platform === platform);
}

export function filterTools(tools: Tool[], query: string): Tool[] {
  const q = query.trim().toLowerCase();
  if (!q) return tools;
  return tools.filter(
    t => t.label.toLowerCase().includes(q) || (t.owner ?? "").toLowerCase().includes(q),
  );
}

export function filterToolsByQuery(categories: CategoryEntry[], query: string): CategoryEntry[] {
  if (!query.trim()) return categories;
  return categories.reduce<CategoryEntry[]>((acc, { category, tools }) => {
    const matched = filterTools(tools, query);
    if (matched.length > 0) acc.push({ category, tools: matched });
    return acc;
  }, []);
}

export function toolsForCategory(categories: CategoryEntry[], category: Category): Tool[] {
  return categories.find(c => c.category === category)?.tools ?? [];
}

export function findCategoryForToolId(
  categories: CategoryEntry[],
  toolId: ToolId | undefined,
): Category | null {
  if (!toolId) return null;
  return categories.find(({ tools }) => tools.some(t => t.id === toolId))?.category ?? null;
}
