import type { ContactsFeatureIntroduction } from "./types";

export function createClosedContactsFeatureIntroduction(
  onComplete: () => void = () => undefined,
  onClose: () => void = () => undefined,
): ContactsFeatureIntroduction {
  return {
    isOpen: false,
    title: "",
    highlights: [],
    primaryActionLabel: "",
    onComplete,
    onClose,
  };
}
