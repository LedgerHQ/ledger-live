import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import { Trans } from "~/context/Locale";
import Button from "~/components/Button";
import Trash from "~/icons/Trash";
import QueuedDrawer from "~/components/QueuedDrawer";
import { DeviceIllustration } from "~/components/DeviceIllustration";
import { type DeviceSectionDevice } from "../useDeviceSectionViewModel";

type DeviceRemoveDrawerProps = {
  readonly device: DeviceSectionDevice | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onRemove: () => void;
};

export function DeviceRemoveDrawer({ device, isOpen, onClose, onRemove }: DeviceRemoveDrawerProps) {
  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose}>
      {device ? (
        <Flex alignItems="center" mb={8}>
          <DeviceIllustration deviceModelId={device.modelId} />
        </Flex>
      ) : null}
      <Button
        event="DeviceRemoveAction"
        type="alert"
        IconLeft={Trash}
        title={<Trans i18nKey="common.forgetDevice" />}
        onPress={onRemove}
      />
    </QueuedDrawer>
  );
}
