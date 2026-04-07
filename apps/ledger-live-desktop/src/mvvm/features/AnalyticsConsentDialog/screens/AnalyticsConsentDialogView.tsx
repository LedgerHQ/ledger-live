import React, { useMemo } from "react";
import { Title as DialogTitle } from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { AnalyticsConsentDialogPhase } from "@ledgerhq/live-common/analyticsConsentUtils";
import { ConsentFooter } from "../components/ConsentFooter";
import { DescriptionWithPreferencesLink } from "../components/DescriptionWithPreferencesLink";
import { PrivacyDescription } from "../components/PrivacyDescription";

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
  const { t } = useTranslation();
  const theme = useTheme();

  /** Light: black @ 30%; dark: white @ 30% — matches react-ui palettes (see shared/palettes). */
  const sheetSurfaceStyle = useMemo(
    () => ({
      backgroundImage: `radial-gradient(43.51% 33.05% at 50.47% 0.14%, ${theme.colors.opacityDefault.c30} 0%, transparent 100%)`,
      backgroundSize: "100% 100%" as const,
      backgroundRepeat: "no-repeat" as const,
    }),
    [theme.colors.opacityDefault.c30],
  );

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
            {phase === "privacy" ? (
              <Spot appearance="info" size={72} />
            ) : (
              <Spot appearance="icon" icon={LedgerLogo} size={72} />
            )}
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
          </div>
        </DialogBody>
        <DialogFooter className="flex flex-col gap-16 pt-32">
          {phase === "privacy" ? (
            <Button appearance="base" isFull size="lg" onClick={onPrivacyGotIt}>
              {t("analyticsConsentModal.privacy.ctaGotIt")}
            </Button>
          ) : (
            <>
              <Button appearance="base" isFull size="lg" onClick={applyOptIn}>
                {phase === "consentReconfirm"
                  ? t("analyticsConsentModal.reconfirm.ctaContinue")
                  : t("analyticsConsentModal.fresh.ctaAcceptAll")}
              </Button>
              <Button appearance="gray" isFull size="lg" onClick={applyOptOut}>
                {phase === "consentReconfirm"
                  ? t("analyticsConsentModal.reconfirm.ctaStop")
                  : t("analyticsConsentModal.fresh.ctaRefuseAll")}
              </Button>
            </>
          )}
        </DialogFooter>
        {phase !== "privacy" && (
          <div className="shrink-0 px-24 pt-16">
            <ConsentFooter privacyPolicyUrl={privacyPolicyUrl} onOpenPrivacyPolicy={onOpenPrivacyPolicy} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
