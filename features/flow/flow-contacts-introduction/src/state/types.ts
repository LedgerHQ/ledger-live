export type ContactsLedgerSyncStatus = "ready" | "checking" | "inactive" | "unavailable";

export type ContactsLedgerSyncIntroduction = Readonly<{
  isOpen: boolean;
  title: string;
  description: string;
  activateLabel: string;
  dismissLabel: string;
  onActivate: () => void;
  onDismiss: () => void;
}>;

export type ContactsFeatureIntroductionHighlightIcon = "Contact" | "ShieldCheck" | "Devices";

export type ContactsFeatureIntroductionHighlight = Readonly<{
  title: string;
  description: string;
  icon: ContactsFeatureIntroductionHighlightIcon;
}>;

export type ContactsFeatureIntroduction = Readonly<{
  isOpen: boolean;
  title: string;
  highlights: readonly ContactsFeatureIntroductionHighlight[];
  primaryActionLabel: string;
  heroImageSrc?: string;
  onComplete: () => void;
  onClose: () => void;
}>;
