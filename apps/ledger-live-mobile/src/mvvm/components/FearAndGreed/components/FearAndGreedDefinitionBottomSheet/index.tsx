import React, { memo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { Text, BottomSheetView, BottomSheetHeader } from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import QueuedDrawerGorhom, {
  BottomSheetView as GorhomBottomSheetView,
} from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import FearAndGreedTitle from "../FearAndGreedTitle";

type FearAndGreedDefinitionBottomSheetProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
}>;

/**
 * Single source of truth for the Fear & Greed definition drawer, shared by every
 * FearAndGreed appearance so the content is never duplicated.
 */
function FearAndGreedDefinitionBottomSheet({
  isOpen,
  onClose,
}: FearAndGreedDefinitionBottomSheetProps) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { isEnabled } = useWalletFeaturesConfig("mobile");

  if (isEnabled) {
    return (
      <QueuedDrawerBottomSheet isRequestingToBeOpened={isOpen} onClose={onClose} enableDynamicSizing>
        <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
          <BottomSheetHeader />
          <FearAndGreedTitle />
          <Text typography="body1" lx={{ color: "base" }}>
            {t("fearAndGreed.description")}
          </Text>
        </BottomSheetView>
      </QueuedDrawerBottomSheet>
    );
  }

  return (
    <QueuedDrawerGorhom isRequestingToBeOpened={isOpen} onClose={onClose} enableDynamicSizing>
      <GorhomBottomSheetView style={{ paddingBottom: bottomInset + 24, paddingTop: 32 }}>
        <FearAndGreedTitle />
        <Text typography="body1" lx={{ color: "base" }}>
          {t("fearAndGreed.description")}
        </Text>
      </GorhomBottomSheetView>
    </QueuedDrawerGorhom>
  );
}

export default memo(FearAndGreedDefinitionBottomSheet);
