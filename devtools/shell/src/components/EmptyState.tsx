import type { Tool } from "../types";

interface EmptyStateProps {
  categories: Array<{ category: string; tools: Tool[] }>;
  onSelect: (id: string) => void;
  "data-testid"?: string;
}

export function EmptyState({ categories, onSelect, "data-testid": testId }: EmptyStateProps) {
  return (
    <div data-testid={testId} className="flex-1 p-32 overflow-y-auto">
      <p className="body-1 text-muted uppercase tracking-wider">DevTools</p>
      <h1 className="heading-1 font-semibold tracking-tight">What do you need to inspect?</h1>
      <p className="body-1 text-muted mb-24">Pick a tool from the sidebar.</p>
      <div className="grid grid-cols-2 gap-8">
        {categories.map(({ category, tools }) => (
          <div
            key={category}
            className="p-14 bg-surface rounded-xl border border-muted cursor-pointer hover:bg-surface-hover"
            role="button"
            tabIndex={0}
            onClick={() => tools[0] && onSelect(tools[0].id)}
            onKeyDown={e => e.key === "Enter" && tools[0] && onSelect(tools[0].id)}
          >
            <h5 className="heading-5 font-semibold">{category}</h5>
            <span className="body-1 text-muted">
              {tools.length} tool{tools.length === 1 ? "" : "s"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
