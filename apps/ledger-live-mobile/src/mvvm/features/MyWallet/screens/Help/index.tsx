import React from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Box,
  BottomSheetHeader,
  BottomSheetView,
  Button,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  Text,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Download, Information, LifeRing, Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { useMyWalletHelpViewModel } from "./useMyWalletHelpViewModel";
import { HelpListItem } from "./components/HelpListItem";

export function MyWalletHelpScreen() {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const {
    isChatbotEnabled,
    onLedgerSupportPress,
    onLedgerAcademyPress,
    onSaveLogsPress,
    onLedgerStatusPress,
    onClearCachePress,
    onClearCacheConfirm,
    isClearCacheDrawerOpen,
    onClearCacheDrawerClose,
  } = useMyWalletHelpViewModel();

  return (
    <>
      <ScrollView testID="my-wallet-help-screen">
        <TrackScreen category="MyWallet" name="Help" />
        <Box lx={{ paddingHorizontal: "s16", paddingTop: "s24", gap: "s24" }}>
          <Box lx={{ gap: "s8" }}>
            <Subheader>
              <SubheaderRow testID="my-wallet-help-section-support">
                <SubheaderTitle>{t("myWallet.help.sections.supportAndLearning")}</SubheaderTitle>
              </SubheaderRow>
            </Subheader>
            <HelpListItem
              onPress={onLedgerSupportPress}
              testID="help-ledger-support-row"
              icon={LifeRing}
              title={
                isChatbotEnabled ? t("help.chatbot") : t("myWallet.help.rows.ledgerSupport.title")
              }
              description={t("myWallet.help.rows.ledgerSupport.description")}
            />
            <HelpListItem
              onPress={onLedgerAcademyPress}
              testID="help-ledger-academy-row"
              icon={Information}
              title={t("myWallet.help.rows.ledgerAcademy.title")}
              description={t("myWallet.help.rows.ledgerAcademy.description")}
            />
          </Box>

          <Box lx={{ gap: "s8" }}>
            <Subheader>
              <SubheaderRow testID="my-wallet-help-section-more">
                <SubheaderTitle>{t("myWallet.help.sections.more")}</SubheaderTitle>
              </SubheaderRow>
            </Subheader>
            <HelpListItem
              onPress={onSaveLogsPress}
              testID="help-save-logs-row"
              icon={Download}
              title={t("myWallet.help.rows.saveLogs.title")}
              description={t("myWallet.help.rows.saveLogs.description")}
              trailing="chevron"
            />
            <HelpListItem
              onPress={onLedgerStatusPress}
              testID="help-ledger-status-row"
              icon={Information}
              title={t("myWallet.help.rows.ledgerStatus.title")}
              description={t("myWallet.help.rows.ledgerStatus.description")}
            />
            <HelpListItem
              onPress={onClearCachePress}
              testID="help-clear-cache-row"
              icon={Trash}
              title={t("myWallet.help.rows.clearCache.title")}
              description={t("myWallet.help.rows.clearCache.description")}
              trailing="chevron"
            />
          </Box>
        </Box>
      </ScrollView>

      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={isClearCacheDrawerOpen}
        onClose={onClearCacheDrawerClose}
        enableDynamicSizing
      >
        <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
          <BottomSheetHeader />
          <Box lx={{ alignItems: "center", gap: "s16", paddingHorizontal: "s16" }}>
            <Spot appearance="info" size={72} />
            <Text typography="heading5SemiBold" lx={{ textAlign: "center", color: "base" }}>
              {t("settings.help.clearCache")}
            </Text>
            <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
              {t("settings.help.clearCacheModalDesc")}
            </Text>
          </Box>
          <Box lx={{ paddingHorizontal: "s16", paddingTop: "s24", gap: "s8" }}>
            <Button
              appearance="base"
              size="lg"
              onPress={onClearCacheConfirm}
              testID="clear-cache-button"
            >
              {t("settings.help.clearCacheButton")}
            </Button>
            <Button appearance="transparent" size="lg" onPress={onClearCacheDrawerClose}>
              {t("common.cancel")}
            </Button>
          </Box>
        </BottomSheetView>
      </QueuedDrawerBottomSheet>
    </>
  );
}
