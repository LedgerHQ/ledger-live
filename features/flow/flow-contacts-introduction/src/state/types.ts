export type ContactsLedgerSyncStatus = "ready" | "checking" | "inactive" | "unavailable";

export type ContactsLedgerSyncIntroduction = Readonly<{
  isOpen: boolean;
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
  heroImageSrc?: string;
  onComplete: () => void;
  onClose: () => void;
}>;
