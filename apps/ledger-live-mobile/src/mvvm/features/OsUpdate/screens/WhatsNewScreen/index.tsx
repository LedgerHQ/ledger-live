import React, { useCallback, useEffect } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Banner,
  Box,
  Button,
  Link,
  NavBar,
  NavBarBackButton,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { Trans, useTranslation } from "~/context/Locale";
import { SafeMarkdown } from "LLM/components/SafeMarkdown";
import { LedgerOsLogo } from "../../components/LedgerOsLogo";
import { useOsUpdateTracking } from "../../analytics/TrackingProvider";
import { OsUpdateButton, OsUpdatePage } from "../../analytics/types";

type WhatsNewScreenProps = Readonly<{
  version: string;
  notes: string | null;
  onOpenReleaseNotes: () => void;
  onStart: () => void;
  onClose: () => void;
}>;

export function WhatsNewScreen({
  version,
  notes,
  onOpenReleaseNotes,
  onStart,
  onClose,
}: WhatsNewScreenProps) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { trackPage, trackClick } = useOsUpdateTracking();

  useEffect(() => {
    trackPage({ page: OsUpdatePage.WHATS_NEW, osVersionTo: version });
  }, [trackPage, version]);

  const onPressStart = useCallback(() => {
    trackClick(OsUpdateButton.START);
    onStart();
  }, [trackClick, onStart]);
  const onPressBack = useCallback(() => {
    trackClick(OsUpdateButton.BACK);
    onClose();
  }, [trackClick, onClose]);
  const onPressReleaseNotes = useCallback(() => {
    trackClick(OsUpdateButton.RELEASE_NOTES);
    onOpenReleaseNotes();
  }, [trackClick, onOpenReleaseNotes]);

  return (
    <Box lx={{ flex: 1 }} testID="os-update-whats-new-screen">
      <NavBar density="compact">
        <NavBarBackButton onPress={onPressBack} testID="os-update-whats-new-back-button" />
      </NavBar>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Box lx={{ alignItems: "center", gap: "s16", marginBottom: "s32" }}>
          <LedgerOsLogo />
          <Box lx={{ alignItems: "center", gap: "s4" }}>
            <Text typography="body3" lx={{ color: "muted" }}>
              <Trans i18nKey="osUpdates.whatsNew.productName" />
            </Text>
            <Text typography="heading4SemiBold" lx={{ color: "base" }}>
              <Trans i18nKey="osUpdates.whatsNew.version" values={{ version }} />
            </Text>
          </Box>
        </Box>
        <Banner
          appearance="info"
          description={t("osUpdates.whatsNew.banner")}
          lx={{ marginBottom: "s32" }}
        />
        <Text typography="heading3SemiBold" lx={{ color: "base", marginBottom: "s16" }}>
          <Trans i18nKey="osUpdates.whatsNew.title" />
        </Text>
        {notes ? <SafeMarkdown markdown={notes} /> : null}
        <Box lx={{ marginTop: "s16" }}>
          <Link
            appearance="base"
            isExternal
            onPress={onPressReleaseNotes}
            testID="os-update-whats-new-release-notes-link"
          >
            <Trans i18nKey="osUpdates.whatsNew.releaseNotes" />
          </Link>
        </Box>
      </ScrollView>
      <Box
        lx={{ paddingHorizontal: "s16", paddingTop: "s16" }}
        style={{ paddingBottom: bottomInset + 16 }}
      >
        <Button
          size="lg"
          appearance="base"
          isFull
          onPress={onPressStart}
          testID="os-update-whats-new-start-button"
        >
          <Trans i18nKey="osUpdates.whatsNew.start" />
        </Button>
      </Box>
    </Box>
  );
}
