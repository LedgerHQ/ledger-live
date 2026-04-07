import React from "react";
import { Dialog, DialogBody, DialogContent } from "@ledgerhq/lumen-ui-react";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { AnalyticsConsentDialogPhase } from "@ledgerhq/live-common/analyticsConsentUtils";
import { AnalyticsConsentDialogCopyBlock } from "../components/AnalyticsConsentDialogCopyBlock";
import { AnalyticsConsentDialogFooterActions } from "../components/AnalyticsConsentDialogFooterActions";
import { AnalyticsConsentDialogIllustration } from "../components/AnalyticsConsentDialogIllustration";
import { ConsentFooter } from "../components/ConsentFooter";

const sheetTopGlowClassName =
  "absolute inset-0 bg-[radial-gradient(43.51%_33.05%_at_50.47%_0.14%,var(--color-light-grey-950-10)_0%,transparent_100%)] dark:bg-[radial-gradient(43.51%_33.05%_at_50.47%_0.14%,var(--color-dark-grey-950-30)_0%,transparent_100%)]";

export type AnalyticsConsentDialogViewProps = Readonly<{
  phase: AnalyticsConsentDialogPhase;
  isDialogOpen: boolean;
  title: string;
  descriptionLead: string | null;
  privacyPolicyUrl: string;
  onOpenPrivacyPolicy: () => void;
  applyOptIn: () => void;
  applyOptOut: () => void;
  onPrivacyGotIt: () => void;
  onSetPreferences: () => void;
}>;

export function AnalyticsConsentDialogView({
  phase,
  isDialogOpen,
  title,
  descriptionLead,
  privacyPolicyUrl,
  onOpenPrivacyPolicy,
  applyOptIn,
  applyOptOut,
  onPrivacyGotIt,
  onSetPreferences,
}: AnalyticsConsentDialogViewProps) {
  if (!isDialogOpen) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen}>
      <DialogContent
        data-testid="analytics-consent-dialog"
        className="max-w-[480px]"
        aria-describedby={undefined}
        onPointerDownOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <div aria-hidden className={sheetTopGlowClassName} />
        <div className="flex min-h-0 flex-1 flex-col">
          <TrackPage
            key={phase}
            category="AnalyticsConsentDialog"
            name="Analytics consent"
            type="modal"
            phase={phase}
            refreshSource={false}
          />
          <DialogBody className="items-center gap-24 pt-64 pb-16">
            <AnalyticsConsentDialogIllustration phase={phase} />
            <AnalyticsConsentDialogCopyBlock
              phase={phase}
              title={title}
              descriptionLead={descriptionLead}
              privacyPolicyUrl={privacyPolicyUrl}
              onOpenPrivacyPolicy={onOpenPrivacyPolicy}
              onSetPreferences={onSetPreferences}
            />
          </DialogBody>
          <AnalyticsConsentDialogFooterActions
            phase={phase}
            applyOptIn={applyOptIn}
            applyOptOut={applyOptOut}
            onPrivacyGotIt={onPrivacyGotIt}
          />
          {phase !== "privacy" && (
            <div className="shrink-0 px-24 pt-16">
              <ConsentFooter privacyPolicyUrl={privacyPolicyUrl} onOpenPrivacyPolicy={onOpenPrivacyPolicy} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
