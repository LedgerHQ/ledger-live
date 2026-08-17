import type { ContactsFeatureIntroduction } from "../../state/types";

export type ContactsFeatureIntroductionContentProps = Omit<ContactsFeatureIntroduction, "onClose"> &
  Readonly<{
    bottomInset: number;
  }>;
