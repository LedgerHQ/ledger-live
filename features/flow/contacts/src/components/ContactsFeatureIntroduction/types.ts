import type { ContactsFeatureIntroduction } from "../../list/types";

export type ContactsFeatureIntroductionContentProps = ContactsFeatureIntroduction &
  Readonly<{
    bottomInset: number;
  }>;
