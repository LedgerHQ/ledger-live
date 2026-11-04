import { useTheme } from "@ledgerhq/lumen-ui-rnative";
import type { ToolKind } from "@devtools/registry";
import { MiniTag } from "../MiniTag/MiniTag";

type Decorative = "Purple" | "Green" | "Blue" | "Orange" | "Turquoise" | "Pink";

const decorativeByKind: Record<ToolKind, Decorative> = {
  entity: "Purple",
  api: "Green",
  feature: "Blue",
  shared: "Orange",
  lib: "Turquoise",
  tool: "Pink",
};

export function KindTag({ kind }: Readonly<{ kind: ToolKind }>) {
  const { theme } = useTheme();
  const decorative = decorativeByKind[kind];
  return <MiniTag label={kind} backgroundColor={theme.colors.bg[`decorative${decorative}`]} />;
}
