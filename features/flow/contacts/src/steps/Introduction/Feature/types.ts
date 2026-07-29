import type { ContactsFeatureIntroduction } from "../types";

export type ContactsFeatureIntroductionContentProps = ContactsFeatureIntroduction &
  Readonly<{
    bottomInset: number;
  }>;
