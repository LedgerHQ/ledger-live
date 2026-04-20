import { Tag } from "@ledgerhq/lumen-ui-react";
import type { Tool } from "../types";

interface ToolShellProps {
  tool: Tool;
}

export function ToolShell({ tool }: ToolShellProps) {
  return (
    <>
      <div className="px-32 pt-20 pb-16 border-b border-muted flex items-start gap-16 shrink-0">
        <div className="flex-1 min-w-0 gap-6">
          <div className="body-3 text-muted mb-4">
            <span>
              {tool.category} / {tool.id}
            </span>
          </div>
          <h1 className="heading-1 font-semibold">{tool.label}</h1>
          {tool.desc && <p className="body-2 text-muted">{tool.desc}</p>}
        </div>
        {tool.owner && <Tag label={tool.owner} appearance="gray" size="sm" className="shrink-0" />}
      </div>
      <div className="flex-1 p-24 overflow-y-auto" />
    </>
  );
}
