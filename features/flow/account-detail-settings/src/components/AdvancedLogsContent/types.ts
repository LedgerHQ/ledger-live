import type { AdvancedLogsInput } from "../../logic/buildAdvancedLogs";

export type AdvancedLogsContentProps = Readonly<{
  input: AdvancedLogsInput;
  locale: string;
  derivationTag?: string;
  onCopied?: (copied: boolean) => void;
}>;

export type AdvancedLogsContentViewProps = Readonly<{
  derivationTip?: string;
  synchronised: string;
  json: string;
  copyLabel: string;
  isCopied: boolean;
  onCopy: () => void;
}>;
