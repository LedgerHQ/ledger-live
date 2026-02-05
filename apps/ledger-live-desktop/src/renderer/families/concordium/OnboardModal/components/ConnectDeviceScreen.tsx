import { DeviceModelId } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import React from "react";
import { Trans } from "react-i18next";
import Modal from "~/renderer/components/Modal";
import ModalBody from "~/renderer/components/Modal/ModalBody";
import { renderConnectYourDevice } from "~/renderer/components/DeviceAction/rendering";
import useTheme from "~/renderer/hooks/useTheme";

type Props = {
  lastSeenDevice: Device | null;
};

export default function ConnectDeviceScreen({ lastSeenDevice }: Props) {
  const fallbackModelId = lastSeenDevice?.modelId || DeviceModelId.nanoS;
  const theme = useTheme();

  return (
    <Modal
      centered
      name="MODAL_CONCORDIUM_ONBOARD_ACCOUNT"
      preventBackdropClick={true}
      render={({ onClose }) => (
        <ModalBody
          title={<Trans i18nKey="families.concordium.addAccount.title" />}
          onClose={onClose}
          noScroll={true}
          render={() =>
            renderConnectYourDevice({
              modelId: fallbackModelId,
              type: theme.theme,
              device: lastSeenDevice || {
                deviceId: "",
                modelId: fallbackModelId,
                wired: false,
              },
              unresponsive: false,
            })
          }
        />
      )}
    />
  );
}
