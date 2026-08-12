export type ContactsLedgerSyncStatus = "ready" | "checking" | "inactive";

export type ContactsLedgerSyncIntroduction = Readonly<{
  isOpen: boolean;
  description: string;
  dismissLabel: string;
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
  description: string;
  highlights: readonly ContactsFeatureIntroductionHighlight[];
  primaryActionLabel: string;
  secondaryActionLabel: string;
  heroImageSrc?: string;
  onComplete: () => void;
  onDefer: () => void;
}>;
