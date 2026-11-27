import type { HelpRowLabels } from "./helpLabels.types";

/** Labels of one row; each app passes its own `t()` calls, so the keys stay literal. */
export function helpRow(title: string, description: string, action?: string): HelpRowLabels {
  return action === undefined ? { title, description } : { title, description, action };
}
