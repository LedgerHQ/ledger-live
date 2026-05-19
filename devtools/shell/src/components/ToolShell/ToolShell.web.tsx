import { Tag } from "@ledgerhq/lumen-ui-react";
import type { DevToolsPropsRegistry, Tool } from "@devtools/core";
import { useIsToolConfigured, useToolProps } from "../../context";
import ToolNotConfigured from "../ToolNotConfigured/ToolNotConfigured";

interface ToolShellProps {
  tool: Tool;
  onBack: () => void;
}

export function ToolShell({ tool, onBack }: ToolShellProps) {
  const isConfigured = useIsToolConfigured(tool);
  const Component = tool.component;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const toolProps = useToolProps(tool.id as keyof DevToolsPropsRegistry);

  return (
    <>
      <div className="px-32 pt-20 pb-16 border-b border-muted flex items-start gap-16 shrink-0">
        <div className="flex-1 min-w-0">
          <button
            onClick={onBack}
            className="body-3 text-muted mb-4 hover:text-base cursor-pointer bg-transparent border-none hover:underline"
          >
            {tool.category} / {tool.id}
          </button>
          <h1 className="heading-1 font-semibold">{tool.label}</h1>
          {tool.desc && <p className="body-2 text-muted">{tool.desc}</p>}
        </div>
        {tool.owner && <Tag label={tool.owner} appearance="gray" size="sm" className="shrink-0" />}
      </div>
      <div className="flex-1 p-24 overflow-y-auto">
        {isConfigured ? <Component {...toolProps} /> : <ToolNotConfigured />}
      </div>
    </>
  );
}
