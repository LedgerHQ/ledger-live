import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import { BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";
import type { AnalyticsConsentPhase } from "@ledgerhq/live-common/analyticsConsent/index";
import { DescriptionWithPreferencesLink } from "../components/DescriptionWithPreferencesLink";
import { PrivacyUpdateSheet } from "../components/PrivacyUpdateSheet";
import { TwoCtaConsentSheet } from "../components/TwoCtaConsentSheet";

export type AnalyticsConsentDrawerViewProps = Readonly<{
  phase: AnalyticsConsentPhase;
  isDrawerOpen: boolean;
  handleCloseDrawer: () => void;
  onPrivacyGotIt: () => void | Promise<void>;
  applyOptIn: () => void | Promise<void>;
  applyOptOut: () => void | Promise<void>;
  onSetPreferences: () => void;
}>;

export function AnalyticsConsentDrawerView(props: AnalyticsConsentDrawerViewProps) {
  const {
    phase,
    isDrawerOpen,
    handleCloseDrawer,
    onPrivacyGotIt,
    applyOptIn,
    applyOptOut,
    onSetPreferences,
  } = props;
  const { t } = useTranslation();
  const privacyPolicyUrl = useLocalizedUrl(urls.privacyPolicy.en);
  const { bottom: bottomInset } = useSafeAreaInsets();

  if (!isDrawerOpen) return null;

  const paddingBottom = bottomInset + 24;

  let sheetBody: React.ReactNode = null;
  if (phase === "consentReconfirm") {
    sheetBody = (
      <TwoCtaConsentSheet
        title={t("analyticsConsentDrawer.reconfirm.title")}
        description={
          <DescriptionWithPreferencesLink
            text={t("analyticsConsentDrawer.reconfirm.description")}
            onSetPreferences={onSetPreferences}
          />
        }
        primaryLabel={t("analyticsConsentDrawer.reconfirm.ctaContinue")}
        secondaryLabel={t("analyticsConsentDrawer.reconfirm.ctaStop")}
        onPrimary={applyOptIn}
        onSecondary={applyOptOut}
        privacyPolicyUrl={privacyPolicyUrl}
      />
    );
  } else if (phase === "consentFresh") {
    sheetBody = (
      <TwoCtaConsentSheet
        title={t("analyticsConsentDrawer.fresh.title")}
        description={
          <DescriptionWithPreferencesLink
            text={t("analyticsConsentDrawer.fresh.description")}
            onSetPreferences={onSetPreferences}
          />
        }
        primaryLabel={t("analyticsConsentDrawer.fresh.ctaAcceptAll")}
        secondaryLabel={t("analyticsConsentDrawer.fresh.ctaRefuseAll")}
        onPrimary={applyOptIn}
        onSecondary={applyOptOut}
        privacyPolicyUrl={privacyPolicyUrl}
      />
    );
  } else if (phase === "privacy") {
    sheetBody = <PrivacyUpdateSheet privacyPolicyUrl={privacyPolicyUrl} onGotIt={onPrivacyGotIt} />;
  }

  const sheetChrome = (
    <Box lx={{ width: "full", paddingHorizontal: "s16", paddingTop: "s64" }}>{sheetBody}</Box>
  );

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isDrawerOpen}
      onClose={handleCloseDrawer}
      enableDynamicSizing
      preventBackdropClick
      enablePanDownToClose={false}
      noCloseButton
      testID="analytics-consent-drawer"
    >
      <BottomSheetView style={{ paddingHorizontal: 0, paddingBottom }}>
        <>
          <TrackScreen
            key={phase}
            category="AnalyticsConsentDrawer"
            name="Analytics consent"
            type="drawer"
            phase={phase}
            refreshSource={false}
          />
          {sheetChrome}
        </>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
