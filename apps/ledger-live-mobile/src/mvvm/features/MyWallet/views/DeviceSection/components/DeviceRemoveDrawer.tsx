import React from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
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

  return (
    <QueuedDrawerBottomSheet isRequestingToBeOpened={isOpen} onClose={onClose} enableDynamicSizing>
      {device ? (
        <Box lx={{ alignItems: "center", marginBottom: "s32" }}>
          <DeviceIllustration deviceModelId={device.modelId} />
        </Box>
      ) : null}
      <Button appearance="red" size="lg" icon={Trash} onPress={onRemove}>
        {t("common.forgetDevice")}
      </Button>
    </QueuedDrawerBottomSheet>
  );
}
