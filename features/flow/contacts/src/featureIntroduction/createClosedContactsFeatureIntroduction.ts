import type { ContactsFeatureIntroduction } from "../list/types";

export function createClosedContactsFeatureIntroduction(
  onComplete: () => void = () => undefined,
  onDefer: () => void = () => undefined,
): ContactsFeatureIntroduction {
  return {
    isOpen: false,
    title: "",
    description: "",
    highlights: [],
    primaryActionLabel: "",
    secondaryActionLabel: "",
    onComplete,
    onDefer,
  };
}
