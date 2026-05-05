import { Star, Clock } from "@ledgerhq/lumen-ui-react/symbols";
import { Category } from "../../types";
import type { Tool } from "../../types";
import { SectionHeader } from "../SectionHeader/SectionHeader.web";
import { CategoryCard } from "../CategoryCard/CategoryCard.web";
import { ToolCard } from "../ToolCard/ToolCard.web";

interface OverviewProps {
  categories: Array<{ category: Category; tools: Tool[] }>;
  recentToolIds: string[];
  onSelect: (id: string) => void;
  "data-testid"?: string;
}

export function Overview({
  categories,
  recentToolIds,
  onSelect,
  "data-testid": testId,
}: OverviewProps) {
  const allTools = categories.flatMap(c => c.tools);
  const recentTools: Tool[] = recentToolIds.flatMap(id => allTools.filter(t => t.id === id));
  return (
    <div data-testid={testId} className="flex-1 p-32 overflow-y-auto">
      <p className="body-1 text-muted uppercase tracking-wider">DevTools</p>
      <h1 className="heading-1 font-semibold">What do you need to inspect?</h1>
      <p className="body-1 text-muted mb-24">Pick a tool from the sidebar.</p>

      {recentTools.length > 0 && (
        <div className="mb-24">
          <SectionHeader icon={Clock} label="Recent" />
          <div className="grid grid-cols-2 gap-8">
            {recentTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}

      <SectionHeader icon={Star} label="All Tools" />
      <div className="grid grid-cols-2 gap-8">
        {categories.map(({ category, tools }) => (
          <CategoryCard key={category} category={category} tools={tools} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
