import React, { memo } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";
import {
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  Spot,
  BottomSheetView,
  BottomSheetHeader,
} from "@ledgerhq/lumen-ui-rnative";
import { Snow, DeleteCircle, PictureImage } from "@ledgerhq/lumen-ui-rnative/symbols";
import QueuedDrawerBottomSheet from "~/mvvm/components/QueuedDrawer/QueuedDrawerBottomSheet";

interface Props {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly isCardFrozen: boolean;
  readonly isCardBlocked: boolean;
  readonly onFreezeCard: () => void;
  readonly onBlockCard: () => void;
  readonly onCustomizeCard: () => void;
}

const listItemLx = { marginHorizontal: "-s8" as const };
const listItemContentLx = { justifyContent: "center" as const };

const SettingsBottomSheet = memo(function SettingsBottomSheet({
  isOpen,
  onClose,
  isCardFrozen,
  isCardBlocked,
  onFreezeCard,
  onBlockCard,
  onCustomizeCard,
}: Props) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedDrawerBottomSheet isRequestingToBeOpened={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetView style={[styles.content, { paddingBottom: bottomInset + 24 }]}>
        <BottomSheetHeader />

        <ListItem lx={listItemLx} onPress={onFreezeCard}>
          <ListItemLeading lx={{ alignItems: "center" }}>
            <Spot
              appearance="icon"
              icon={Snow}
              size={48}
              lx={isCardFrozen ? { backgroundColor: "error" } : undefined}
            />
            <ListItemContent lx={listItemContentLx}>
              <ListItemTitle typography="body2SemiBold">
                {isCardFrozen
                  ? t("baanxCard.dashboard.settings.unfreezeCard")
                  : t("baanxCard.dashboard.settings.freezeCard")}
              </ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>

        <ListItem lx={listItemLx} onPress={onBlockCard}>
          <ListItemLeading lx={{ alignItems: "center" }}>
            <Spot
              appearance="icon"
              icon={DeleteCircle}
              size={48}
              lx={isCardBlocked ? { backgroundColor: "error" } : undefined}
            />
            <ListItemContent lx={listItemContentLx}>
              <ListItemTitle typography="body2SemiBold">
                {isCardBlocked
                  ? t("baanxCard.dashboard.settings.unblockCard")
                  : t("baanxCard.dashboard.settings.blockCard")}
              </ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>

        <ListItem lx={listItemLx} onPress={onCustomizeCard}>
          <ListItemLeading lx={{ alignItems: "center" }}>
            <Spot appearance="icon" icon={PictureImage} size={48} />
            <ListItemContent lx={listItemContentLx}>
              <ListItemTitle typography="body2SemiBold">
                {t("baanxCard.dashboard.settings.customizeCard")}
              </ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 8,
  },
});

export default SettingsBottomSheet;
