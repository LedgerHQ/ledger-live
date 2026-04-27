import { Category } from "../types";
import type { Tool } from "../types";

type CategoryEntry = { category: Category; tools: Tool[] };

export function filterToolsByQuery(categories: CategoryEntry[], query: string): CategoryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return categories;
  return categories
    .map(({ category, tools }) => ({
      category,
      tools: tools.filter(
        t => t.label.toLowerCase().includes(q) || (t.owner ?? "").toLowerCase().includes(q),
      ),
    }))
    .filter(({ tools }) => tools.length > 0);
}

export function findCategoryForToolId(
  categories: CategoryEntry[],
  toolId: string | undefined,
): Category | null {
  if (!toolId) return null;
  return categories.find(({ tools }) => tools.some(t => t.id === toolId))?.category ?? null;
}
