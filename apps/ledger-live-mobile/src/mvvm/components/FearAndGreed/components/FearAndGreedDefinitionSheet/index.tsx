import React, { memo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetView, Text } from "@ledgerhq/lumen-ui-rnative";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import QueuedDrawerGorhom, {
  BottomSheetView as GorhomBottomSheetView,
} from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{
  isOpen: boolean;
  onClose: () => void;
}>;

function FearAndGreedDefinitionSheet({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { isEnabled } = useWalletFeaturesConfig("mobile");

  const content = (
    <>
      <Text
        typography="heading2SemiBold"
        lx={{ color: "base", marginBottom: "s12" }}
        testID="fear-and-greed-title"
      >
        {t("fearAndGreed.title")}
      </Text>
      <Text typography="body1" lx={{ color: "base" }}>
        {t("fearAndGreed.description")}
      </Text>
      <Text typography="body4" lx={{ color: "muted", marginTop: "s16" }}>
        {t("fearAndGreed.disclaimer")}
      </Text>
    </>
  );

  if (isEnabled) {
    return (
      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={isOpen}
        onClose={onClose}
        enableDynamicSizing
      >
        <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
          <BottomSheetHeader />
          {content}
        </BottomSheetView>
      </QueuedDrawerBottomSheet>
    );
  }

  return (
    <QueuedDrawerGorhom isRequestingToBeOpened={isOpen} onClose={onClose} enableDynamicSizing>
      <GorhomBottomSheetView style={{ paddingBottom: bottomInset + 24, paddingTop: 32 }}>
        {content}
      </GorhomBottomSheetView>
    </QueuedDrawerGorhom>
  );
}

export default memo(FearAndGreedDefinitionSheet);
