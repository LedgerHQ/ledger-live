import type { ProtectionPromptViewModel } from "../../protectionPrompt";

export type EnableProtectionSheetProps = ProtectionPromptViewModel &
  Readonly<{
    reason?: string;
    bottomInset?: number;
    /** Called once the sheet has left the screen, for a caller that has to wait for it. */
    onHidden?: () => void;
  }>;
