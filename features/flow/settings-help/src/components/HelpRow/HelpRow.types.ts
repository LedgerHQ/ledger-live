import type { HelpSlots } from "../../types";
import type { HelpRowViewModel } from "../../useHelpViewModel";

export type HelpRowProps = Readonly<{ row: HelpRowViewModel; slots: HelpSlots }>;
