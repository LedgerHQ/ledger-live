import type { ContactsFeatureIntroduction } from "./types";

export function createClosedContactsFeatureIntroduction(
  onDismiss: () => void = () => undefined,
): ContactsFeatureIntroduction {
  return {
    isOpen: false,
    title: "",
    description: "",
    highlights: [],
    primaryActionLabel: "",
    secondaryActionLabel: "",
    onDismiss,
  };
}
