import React, { useCallback } from "react";
import { Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocale, useTranslation } from "~/context/Locale";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { BottomSheetView, Box, Button, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import QueuedDrawerGorhom, {
  BottomSheetView as GorhomBottomSheetView,
} from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import { urls } from "~/utils/urls";
import type { ConsentDrawerPhase } from "./analyticsConsentDrawerLogic";

function ConsentSheetFigmaHeader() {
  return (
    <Box lx={{ width: "full" }}>
      <Box
        lx={{
          width: "full",
          flexDirection: "row",
          alignItems: "center",
          gap: "s16",
          paddingTop: "s64",
          paddingHorizontal: "s16",
        }}
      />
    </Box>
  );
}

export type AnalyticsConsentDrawerViewProps = Readonly<{
  phase: ConsentDrawerPhase;
  isDrawerOpen: boolean;
  handleCloseDrawer: () => void;
  onPrivacyGotIt: () => void;
  applyOptIn: () => void;
  applyOptOut: () => void;
  onSetPreferences: () => void;
}>;

type ConsentFooterProps = Readonly<{ privacyPolicyUrl: string }>;

function ConsentFooter({ privacyPolicyUrl }: ConsentFooterProps) {
  const { t } = useTranslation();
  const openPrivacyPolicy = useCallback(() => {
    Linking.openURL(privacyPolicyUrl).catch(() => {});
  }, [privacyPolicyUrl]);

  return (
    <Box lx={{ width: "full", alignItems: "center" }}>
      <Text typography="body4" lx={{ color: "muted", textAlign: "center" }}>
        {t("analyticsConsentDrawer.footer.lead")}{" "}
        <Text accessibilityRole="link" onPress={openPrivacyPolicy} typography="body4" lx={{ textDecorationLine: "underline" }}>
          {t("analyticsConsentDrawer.footer.privacyLink")}
        </Text>
      </Text>
    </Box>
  );
}

type DescriptionWithPreferencesLinkProps = Readonly<{
  text: string;
  onSetPreferences: () => void;
}>;

function DescriptionWithPreferencesLink({ text, onSetPreferences }: DescriptionWithPreferencesLinkProps) {
  const { t } = useTranslation();
  return (
    <Text typography="body2" lx={{ color: "muted", textAlign: "center", width: "full" }}>
      {text}{" "}
      <Text accessibilityRole="link" onPress={onSetPreferences} typography="body2" lx={{ color: "interactive" }}>
        {t("analyticsConsentDrawer.setPreferences")}
      </Text>
    </Text>
  );
}

type PrivacyDescriptionProps = Readonly<{ privacyPolicyUrl: string }>;

function PrivacyDescription({ privacyPolicyUrl }: PrivacyDescriptionProps) {
  const { t } = useTranslation();
  const openPrivacyPolicy = useCallback(() => {
    Linking.openURL(privacyPolicyUrl).catch(() => {});
  }, [privacyPolicyUrl]);

  return (
    <Text typography="body2" lx={{ color: "muted", textAlign: "center", width: "full" }}>
      {t("analyticsConsentDrawer.privacy.descriptionLead")}
      <Text
        accessibilityRole="link"
        typography="body2"
        lx={{ textDecorationLine: "underline" }}
        onPress={openPrivacyPolicy}
      >
        {t("analyticsConsentDrawer.privacy.descriptionLinkLabel")}
      </Text>
      {t("analyticsConsentDrawer.privacy.descriptionTrail")}
    </Text>
  );
}

type TwoCtaSheetProps = Readonly<{
  title: string;
  description: React.ReactNode;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  privacyPolicyUrl: string;
}>;

function TwoCtaConsentSheet({
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  privacyPolicyUrl,
}: TwoCtaSheetProps) {
  return (
    <Box lx={{ width: "full" }}>
      <Box lx={{ width: "full", gap: "s32", paddingBottom: "s16" }}>
        <Box lx={{ width: "full", gap: "s24", alignItems: "center" }}>
          <Spot appearance="icon" icon={LedgerLogo} size={72} />
          <Box lx={{ width: "full", gap: "s8", alignItems: "center" }}>
            <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center", width: "full" }}>
              {title}
            </Text>
            {description}
          </Box>
        </Box>
        <Box lx={{ width: "full", gap: "s16" }}>
          <Button appearance="base" size="lg" lx={{ width: "full" }} onPress={onPrimary}>
            {primaryLabel}
          </Button>
          <Button appearance="gray" size="lg" lx={{ width: "full" }} onPress={onSecondary}>
            {secondaryLabel}
          </Button>
        </Box>
      </Box>
      <Box lx={{ width: "full", paddingBottom: "s24" }}>
        <ConsentFooter privacyPolicyUrl={privacyPolicyUrl} />
      </Box>
    </Box>
  );
}

type PrivacySheetProps = Readonly<{
  privacyPolicyUrl: string;
  onGotIt: () => void;
}>;

function PrivacyUpdateSheet({ privacyPolicyUrl, onGotIt }: PrivacySheetProps) {
  const { t } = useTranslation();

  return (
    <Box lx={{ width: "full" }}>
      <Box lx={{ width: "full", gap: "s32", paddingBottom: "s12" }}>
        <Box lx={{ width: "full", gap: "s24", alignItems: "center" }}>
          <Spot appearance="info" size={72} />
          <Box lx={{ width: "full", gap: "s8", alignItems: "center" }}>
            <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center", width: "full" }}>
              {t("analyticsConsentDrawer.privacy.title")}
            </Text>
            <PrivacyDescription privacyPolicyUrl={privacyPolicyUrl} />
          </Box>
        </Box>
        <Button appearance="base" size="lg" lx={{ width: "full" }} onPress={onGotIt}>
          {t("analyticsConsentDrawer.privacy.ctaGotIt")}
        </Button>
      </Box>
    </Box>
  );
}

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
  const { locale } = useLocale();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { isEnabled: useLumenBottomSheet } = useWalletFeaturesConfig("mobile");

  const privacyPolicyUrl =
    (urls.privacyPolicy as Record<string, string>)[locale] || urls.privacyPolicy.en;

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

  if (!isDrawerOpen) return null;

  const sheetChrome = (
    <>
      <ConsentSheetFigmaHeader />
      <Box lx={{ width: "full", paddingHorizontal: "s16" }}>{sheetBody}</Box>
    </>
  );

  if (useLumenBottomSheet) {
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
        <BottomSheetView style={{ paddingHorizontal: 0, paddingBottom }}>{sheetChrome}</BottomSheetView>
      </QueuedDrawerBottomSheet>
    );
  }

  return (
    <QueuedDrawerGorhom
      isRequestingToBeOpened={isDrawerOpen}
      onClose={handleCloseDrawer}
      enableDynamicSizing
      preventBackdropClick
      enablePanDownToClose={false}
      noCloseButton
      style={{ paddingHorizontal: 0 }}
    >
      <GorhomBottomSheetView style={{ paddingHorizontal: 0, paddingBottom }}>{sheetChrome}</GorhomBottomSheetView>
    </QueuedDrawerGorhom>
  );
}
