import type { Tool } from "@devtools/registry";
import { useToolProps } from "../../context";
import { KindTag } from "../KindTag/KindTag";
import { MiniTag } from "../MiniTag/MiniTag";

interface ToolShellProps {
  tool: Tool;
  onBack: () => void;
}

export function ToolShell({ tool, onBack }: ToolShellProps) {
  const toolProps = useToolProps(tool.id) ?? {};
  const Component = tool.component;

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
          <h1 className="heading-1">{tool.label}</h1>
          {tool.desc && <p className="body-2 text-muted">{tool.desc}</p>}
        </div>
        <div className="flex items-center gap-8 shrink-0">
          {tool.kind && <KindTag kind={tool.kind} />}
          {tool.owner && <MiniTag label={tool.owner} />}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Component {...toolProps} />
      </div>
    </>
  );
}
