import type { ContactsFeatureIntroduction } from "../../state/types";

export type ContactsFeatureIntroductionContentProps = ContactsFeatureIntroduction &
  Readonly<{
    bottomInset: number;
  }>;
