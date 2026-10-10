import React from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Banner, Box, Button, NavBar, NavBarBackButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { Trans, useTranslation } from "~/context/Locale";
import { SafeMarkdown } from "LLM/components/SafeMarkdown";
import { LedgerOsLogo } from "../../components/LedgerOsLogo";

type WhatsNewScreenProps = Readonly<{
  version: string;
  notes: string | null;
  onStart: () => void;
  onClose: () => void;
}>;

export function WhatsNewScreen({ version, notes, onStart, onClose }: WhatsNewScreenProps) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <Box lx={{ flex: 1 }} testID="os-update-whats-new-screen">
      <NavBar density="compact">
        <NavBarBackButton onPress={onClose} testID="os-update-whats-new-back-button" />
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
      </ScrollView>
      <Box
        lx={{ paddingHorizontal: "s16", paddingTop: "s16" }}
        style={{ paddingBottom: bottomInset + 16 }}
      >
        <Button
          size="lg"
          appearance="base"
          isFull
          onPress={onStart}
          testID="os-update-whats-new-start-button"
        >
          <Trans i18nKey="osUpdates.whatsNew.start" />
        </Button>
      </Box>
    </Box>
  );
}
