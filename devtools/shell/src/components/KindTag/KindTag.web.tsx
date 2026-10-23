import type { ToolKind } from "@devtools/registry";
import { MiniTag } from "../MiniTag/MiniTag";

const colorByKind: Record<ToolKind, string> = {
  entity: "bg-decorative-purple/30 text-decorative-purple",
  api: "bg-decorative-green/30 text-decorative-green",
  feature: "bg-decorative-blue/30 text-decorative-blue",
  shared: "bg-decorative-orange/30 text-decorative-orange",
  lib: "bg-decorative-turquoise/30 text-decorative-turquoise",
  tool: "bg-decorative-pink/30 text-decorative-pink",
};

export function KindTag({ kind }: Readonly<{ kind: ToolKind }>) {
  return <MiniTag label={kind} className={colorByKind[kind]} />;
}
