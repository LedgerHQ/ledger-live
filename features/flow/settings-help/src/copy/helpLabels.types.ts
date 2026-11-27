import type { SettingsConfirmSheetLabels } from "@features/flow-settings";
import type { DesktopHelpItemId, HelpGroupId, SharedHelpItemId } from "../logic/helpItems";

export type HelpRowLabels = Readonly<{ title: string; description: string; action?: string }>;

/** Each app keeps its translated keys: only the desktop has the wording of the desktop rows. */
export type HelpLabels = Readonly<{
  title: string;
  groups: Readonly<Record<HelpGroupId, string>>;
  items: Readonly<
    Record<SharedHelpItemId, HelpRowLabels> & Partial<Record<DesktopHelpItemId, HelpRowLabels>>
  >;
  confirmations: Readonly<{
    clearCache: SettingsConfirmSheetLabels;
    resetApp?: SettingsConfirmSheetLabels;
  }>;
  /** Title of the support row when it opens the chatbot. */
  chatbotSupportTitle?: string;
}>;
