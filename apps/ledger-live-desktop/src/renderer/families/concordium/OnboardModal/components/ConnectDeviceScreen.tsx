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
  // Using deprecated palette.type because theme.theme is not correctly set by StyleProvider (V2).
  // StyleProviderV3 sets theme.theme correctly, but V2 only sets palette.type.
  // Since DeviceAction also uses palette.type, we maintain consistency here.
  const type = theme.colors.palette.type;

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
              type,
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
