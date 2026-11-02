import type { AccountSettingsEventHandler } from "../../logic/accountSettingsEvent";
import type { AdvancedLogsInput } from "../../logic/buildAdvancedLogs";

export type AdvancedLogsContentProps = Readonly<{
  input: AdvancedLogsInput;
  locale: string;
  derivationTag?: string;
  onCopied?: (copied: boolean) => void;
  onEvent?: AccountSettingsEventHandler;
}>;

export type AdvancedLogsContentViewProps = Readonly<{
  derivationTip?: string;
  synchronised: string;
  json: string;
  copyLabel: string;
  isCopied: boolean;
  onCopy: () => void;
}>;
