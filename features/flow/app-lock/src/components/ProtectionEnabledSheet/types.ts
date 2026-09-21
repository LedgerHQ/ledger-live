import type { BiometricsKind } from "@features/platform-app-lock";
import type { ProtectionPromptVariant } from "../../protectionPrompt";

export type ProtectionEnabledSheetProps = Readonly<{
  isOpen: boolean;
  variant: ProtectionPromptVariant;
  biometricsKind?: BiometricsKind;
  reason?: string;
  bottomInset?: number;
  onContinue: () => void;
  onClose: () => void;
}>;
