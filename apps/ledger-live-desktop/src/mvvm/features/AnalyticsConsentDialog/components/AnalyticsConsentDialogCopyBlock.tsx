import React from "react";
import { Title as DialogTitle } from "@radix-ui/react-dialog";
import type { AnalyticsConsentDialogPhase } from "@ledgerhq/live-common/analyticsConsentUtils";
import { DescriptionWithPreferencesLink } from "./DescriptionWithPreferencesLink";
import { PrivacyDescription } from "./PrivacyDescription";

export type AnalyticsConsentDialogCopyBlockProps = Readonly<{
  phase: AnalyticsConsentDialogPhase;
  title: string;
  descriptionLead: string | null;
  privacyPolicyUrl: string;
  onOpenPrivacyPolicy: () => void;
  onSetPreferences: () => void;
}>;

export function AnalyticsConsentDialogCopyBlock({
  phase,
  title,
  descriptionLead,
  privacyPolicyUrl,
  onOpenPrivacyPolicy,
  onSetPreferences,
}: AnalyticsConsentDialogCopyBlockProps) {
  return (
    <div className="flex w-full flex-col items-center gap-8 text-center">
      <DialogTitle className="heading-4-semi-bold text-base w-full">{title}</DialogTitle>
      {phase === "privacy" ? (
        <PrivacyDescription
          privacyPolicyUrl={privacyPolicyUrl}
          onOpenPrivacyPolicy={onOpenPrivacyPolicy}
        />
      ) : (
        descriptionLead != null && (
          <DescriptionWithPreferencesLink
            text={descriptionLead}
            onSetPreferences={onSetPreferences}
          />
        )
      )}
    </div>
  );
}
