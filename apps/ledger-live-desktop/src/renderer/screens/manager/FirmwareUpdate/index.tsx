import React, { useCallback, useContext, useRef } from "react";
import { Trans } from "react-i18next";
import { InstalledItem } from "@ledgerhq/live-common/apps/types";
import { getDeviceModel } from "@ledgerhq/devices";
import manager from "@ledgerhq/live-common/manager/index";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import UpdateModal, { StepId } from "~/renderer/modals/UpdateFirmwareModal";
import Text from "~/renderer/components/Text";
import IconInfoCircle from "~/renderer/icons/InfoCircle";
import Box from "~/renderer/components/Box";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import FirmwareUpdateBanner from "~/renderer/components/FirmwareUpdateBanner";
import { FakeLink } from "~/renderer/components/TopBanner";
import { context } from "~/renderer/drawers/Provider";
import { track } from "~/renderer/analytics/segment";

type Props = {
  deviceInfo: DeviceInfo;
  device: Device;
  setFirmwareUpdateOpened: (a: boolean) => void;
  disableFirmwareUpdate?: boolean;
  installed?: InstalledItem[];
  onReset: (a: string[]) => void;
  firmware: FirmwareUpdateContext | undefined | null;
  error: Error | undefined | null;
  isIncomplete?: boolean;
  openFirmwareUpdate?: boolean;
};

const initialStepId = ({
  deviceInfo,
  device,
}: {
  deviceInfo: DeviceInfo;
  device: Device;
}): StepId =>
  deviceInfo.isOSU
    ? "updateMCU"
    : manager.firmwareUpdateNeedsLegacyBlueResetInstructions(deviceInfo, device.modelId)
    ? "resetDevice"
    : "idCheck";

/**
 * The rewrite of this flow didn't change the behaviour. This renders a banner if
 * needed and interacting with the banner shows a drawer (used to be a modal) to start
 * the firmware update flow.
 */
const FirmwareUpdate = (props: Props) => {
  const {
    deviceInfo,
    device,
    setFirmwareUpdateOpened,
    disableFirmwareUpdate,
    installed,
    firmware,
    error,
    onReset,
  } = props;
  const { setDrawer } = useContext(context);
  const stepId = initialStepId(props);
  const firmwareUpdateCompletedRef = useRef(false);
  const modal = deviceInfo.isOSU ? "install" : props.openFirmwareUpdate ? "disclaimer" : "closed";
  const deviceSpecs = getDeviceModel(device.modelId);
  const isDeprecated = manager.firmwareUnsupported(device.modelId, deviceInfo);

  const onDrawerClose = useCallback(() => {
    onReset((installed || []).map(({ name }) => name));
  }, [installed, onReset]);

  const setFirmwareUpdateCompleted = useCallback((completed: boolean) => {
    firmwareUpdateCompletedRef.current = completed;
  }, []);

  const onRequestClose = useCallback(() => {
    setDrawer();
    if (firmwareUpdateCompletedRef.current) {
      onReset([]);
    }
  }, [onReset, setDrawer]);

  const onShowDisclaimer = useCallback(() => {
    if (!firmware) return;
    track("Manager Firmware Update Click", {
      firmwareName: firmware.final.name,
    });

    setFirmwareUpdateOpened(true); // Prevents manager from reacting to device changes (?)
    setDrawer(
      UpdateModal,
      {
        withAppsToReinstall:
          !!installed &&
          installed.length > 0 &&
          manager.firmwareUpdateWillUninstallApps(deviceInfo, device.modelId),
        withResetStep: manager.firmwareUpdateNeedsLegacyBlueResetInstructions(
          deviceInfo,
          device.modelId,
        ),
        onDrawerClose,
        status: modal,
        stepId: stepId,
        installed: installed,
        firmware: firmware,
        deviceInfo: deviceInfo,
        device: device,
        error: error,
        deviceModelId: deviceSpecs.id,
        setFirmwareUpdateOpened,
        setFirmwareUpdateCompleted,
      },
      {
        preventBackdropClick: true,
        onRequestClose,
      },
    );
  }, [
    device,
    deviceInfo,
    deviceSpecs.id,
    error,
    firmware,
    installed,
    modal,
    onDrawerClose,
    onRequestClose,
    setDrawer,
    setFirmwareUpdateCompleted,
    setFirmwareUpdateOpened,
    stepId,
  ]);

  if (!firmware) {
    if (!isDeprecated) return null;
    return (
      <FirmwareUpdateBanner
        old
        right={
          <FakeLink onClick={() => openURL(urls.contactSupport)}>
            <Trans i18nKey="manager.firmware.banner.old.cta" />
          </FakeLink>
        }
      />
    );
  }

  return (
    <FirmwareUpdateBanner
      right={
        <Box alignItems={"flex-end"} horizontal>
          {manager.firmwareUpdateRequiresUserToUninstallApps(device.modelId, deviceInfo) && (
            <Box px={4} horizontal alignItems="center" color="palette.primary.contrastText">
              <IconInfoCircle size={12} />
              <Text
                style={{
                  marginLeft: 6,
                }}
                ff="Inter"
                fontSize={4}
              >
                <Trans i18nKey="manager.firmware.removeApps" />
              </Text>
            </Box>
          )}
          <FakeLink
            data-test-id="manager-update-firmware-button"
            disabled={!!disableFirmwareUpdate}
            onClick={onShowDisclaimer}
          >
            <Trans i18nKey="manager.firmware.banner.cta2" />
          </FakeLink>
        </Box>
      }
    />
  );
};

export default FirmwareUpdate;
