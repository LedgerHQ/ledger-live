import type { Category, Tool, ToolId, ToolPlatform } from "@devtools/registry";

type CategoryEntry = { category: Category; tools: Tool[] };

export function filterToolsByPlatform(tools: Tool[], platform: ToolPlatform): Tool[] {
  return tools.filter(t => !t.platform || t.platform === platform);
}

const normalize = (text: string) => text.toLowerCase().replaceAll("-", " ");

export function filterTools(tools: Tool[], query: string): Tool[] {
  const q = normalize(query.trim());
  if (!q) return tools;
  return tools.filter(t =>
    [t.label, t.owner, t.kind].some(field => field && normalize(field).includes(q)),
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
