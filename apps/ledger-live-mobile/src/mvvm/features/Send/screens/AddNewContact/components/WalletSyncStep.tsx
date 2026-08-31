import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Spot,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { Refresh } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";

type WalletSyncStepProps = {
  WalletSyncButton: React.ComponentType<{ onPress: () => void }>;
  onWalletSyncPress: () => void;
  onSkipWalletSyncPress: () => void;
};

export function WalletSyncStep({
  WalletSyncButton,
  onWalletSyncPress,
  onSkipWalletSyncPress,
}: WalletSyncStepProps) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <BottomSheetView
      testID="send-add-contact-sync-wallet-step"
      style={{ paddingBottom: bottomInset }}
    >
      <BottomSheetHeader />
      <Box lx={{ flexDirection: "column", gap: "s32" }}>
        <Box lx={{ flexDirection: "column", alignItems: "center", gap: "s24" }}>
          <Spot appearance="icon" size={72} icon={Refresh} />
          <Box lx={{ flexDirection: "column", alignItems: "center", gap: "s8" }}>
            <Text typography="heading4SemiBold" lx={{ color: "base" }}>
              {t("send.newSendFlow.addContact.syncWallet.title")}
            </Text>
            <Text typography="body2" lx={{ color: "muted" }}>
              {t("send.newSendFlow.addContact.syncWallet.description")}
            </Text>
          </Box>
        </Box>
        <Box lx={{ flexDirection: "column", gap: "s16" }}>
          <WalletSyncButton onPress={onWalletSyncPress} />
          <Button
            testID="send-add-contact-sync-wallet-later"
            appearance="gray"
            size="lg"
            isFull
            onPress={onSkipWalletSyncPress}
          >
            {t("walletSync.entryPoints.sendFlow.later")}
          </Button>
        </Box>
      </Box>
    </BottomSheetView>
  );
}
