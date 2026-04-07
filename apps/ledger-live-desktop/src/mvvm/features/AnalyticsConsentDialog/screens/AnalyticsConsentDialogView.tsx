import React from "react";
import { Dialog, DialogBody, DialogContent } from "@ledgerhq/lumen-ui-react";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { AnalyticsConsentDialogPhase } from "@ledgerhq/live-common/analyticsConsentUtils";
import { AnalyticsConsentDialogCopyBlock } from "../components/AnalyticsConsentDialogCopyBlock";
import { AnalyticsConsentDialogFooterActions } from "../components/AnalyticsConsentDialogFooterActions";
import { AnalyticsConsentDialogIllustration } from "../components/AnalyticsConsentDialogIllustration";
import { ConsentFooter } from "../components/ConsentFooter";
import { useAnalyticsConsentDialogSheetStyle } from "../hooks/useAnalyticsConsentDialogSheetStyle";

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
  const sheetSurfaceStyle = useAnalyticsConsentDialogSheetStyle();

  if (!isDialogOpen) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen}>
      <DialogContent
        data-testid="analytics-consent-dialog"
        className="max-w-[480px] bg-canvas-sheet"
        // Radix Content forwards `style`; @ledgerhq/lumen-ui-react types omit it.
        // @ts-expect-error — see above
        style={sheetSurfaceStyle}
        aria-describedby={undefined}
        onPointerDownOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <TrackPage
          key={phase}
          category="AnalyticsConsentDialog"
          name="Analytics consent"
          type="modal"
          phase={phase}
          refreshSource={false}
        />
        <DialogBody className="flex flex-col items-center pt-64 pb-16">
          <div className="flex w-full flex-col items-center gap-24">
            <AnalyticsConsentDialogIllustration phase={phase} />
            <AnalyticsConsentDialogCopyBlock
              phase={phase}
              title={title}
              descriptionLead={descriptionLead}
              privacyPolicyUrl={privacyPolicyUrl}
              onOpenPrivacyPolicy={onOpenPrivacyPolicy}
              onSetPreferences={onSetPreferences}
            />
          </div>
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
      </DialogContent>
    </Dialog>
  );
}
