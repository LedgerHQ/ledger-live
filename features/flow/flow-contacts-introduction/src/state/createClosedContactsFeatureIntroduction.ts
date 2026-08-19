import type { ContactsFeatureIntroduction } from "./types";

export function createClosedContactsFeatureIntroduction(
  onComplete: () => void = () => undefined,
  onClose: () => void = () => undefined,
): ContactsFeatureIntroduction {
  return {
    isOpen: false,
    title: "",
    description: "",
    highlights: [],
    primaryActionLabel: "",
    onComplete,
    onClose,
  };
}
