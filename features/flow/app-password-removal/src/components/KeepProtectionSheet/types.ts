import type { BiometricsKind, Protection } from "@features/platform-app-lock";

export type KeepProtectionSheetProps = Readonly<{
  isOpen: boolean;
  protection: Protection;
  biometricsKind?: BiometricsKind;
  bottomInset?: number;
  onClose: () => void;
}>;
