import type { ContactsFeatureIntroductionHighlightIcon } from "../list/types";

export const CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS = [
  { icon: "Contact", translationKey: "saveAddresses" },
  { icon: "ShieldCheck", translationKey: "sendToRightAddress" },
  { icon: "Devices", translationKey: "privateAcrossDevices" },
] as const satisfies ReadonlyArray<{
  icon: ContactsFeatureIntroductionHighlightIcon;
  translationKey: string;
}>;
