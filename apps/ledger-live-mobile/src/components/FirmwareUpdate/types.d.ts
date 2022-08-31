export type FwUpdateForegroundEvent =
  | { type: "reset"; wired: boolean }
  | { type: "languagePromptDismissed" };
