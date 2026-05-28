import type { LumenStyleSheetTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import type { LineChartColor } from "../types";

type BgColors = Record<
  keyof Pick<LumenStyleSheetTheme["colors"]["bg"], "successStrong" | "errorStrong" | "mutedStrong">,
  string
>;

export function resolveLineChartStroke(color: LineChartColor, bg: BgColors): string {
  switch (color) {
    case "success":
      return bg.successStrong;
    case "error":
      return bg.errorStrong;
    case "muted":
      return bg.mutedStrong;
  }
}
