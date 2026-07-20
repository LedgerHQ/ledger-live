import type { LargeScreenUpsellDismissMethod } from "./analyticsPorts";

export type LargeScreenUpsellModalViewModel = {
  isOpen: boolean;
  imageSrc: string;
  title: string;
  subtitle: string;
  primaryButtonLabel: string;
  onDismiss: (method: LargeScreenUpsellDismissMethod) => void;
  onCtaPress: () => void;
};
