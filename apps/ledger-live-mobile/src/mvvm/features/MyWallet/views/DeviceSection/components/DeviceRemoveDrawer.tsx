import React from "react";
import { BottomSheetView, Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { DeviceIllustration } from "~/components/DeviceIllustration";
import { type DeviceSectionDevice } from "../useDeviceSectionViewModel";

type DeviceRemoveDrawerProps = {
  readonly device: DeviceSectionDevice | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onRemove: () => void;
};

export function DeviceRemoveDrawer({ device, isOpen, onClose, onRemove }: DeviceRemoveDrawerProps) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedDrawerBottomSheet isRequestingToBeOpened={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <Box lx={{ padding: "s16", gap: "s24" }}>
          {device ? (
            <Box lx={{ alignItems: "center" }}>
              <DeviceIllustration deviceModelId={device.modelId} />
            </Box>
          ) : null}
          <Button appearance="red" size="lg" icon={Trash} onPress={onRemove}>
            {t("common.forgetDevice")}
          </Button>
        </Box>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
