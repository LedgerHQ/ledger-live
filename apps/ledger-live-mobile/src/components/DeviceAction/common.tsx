import React, { useMemo } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getDeviceModel } from "@ledgerhq/devices";
import { Text, Flex, IconsLegacy, IconBadge } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { TFunction } from "react-i18next";
import Button from "../wrappedUi/Button";
import Animation from "../Animation";
import { getDeviceAnimation, getDeviceAnimationStyles } from "~/helpers/getDeviceAnimation";
import Link from "../wrappedUi/Link";
import { TrackScreen } from "~/analytics";
import { ArrowRight } from "@ledgerhq/native-ui/assets/icons";

// NEW DEVICE ACTION UX
// area reserved to the project of redefining the UX of the device actions
// new renderings should be define here in order to progressively move towards then new UX
export const AllowManager = ({ wording, device }: { wording: string; device: Device }) => {
  const { theme } = useTheme();
  return (
    <Flex pb={6} pt={6} alignItems="center">
      <Flex>
        <Text fontWeight="semiBold" fontSize={7} textAlign="center">
          {wording}
        </Text>
      </Flex>
      <Animation
        source={getDeviceAnimation({ modelId: device.modelId, key: "allowManager", theme })}
      />
    </Flex>
  );
};

export const ConfirmFirmwareUpdate = ({
  t,
  device,
  currentFirmwareVersion,
  newFirmwareVersion,
}: {
  t: TFunction;
  device: Device;
  currentFirmwareVersion: string;
  newFirmwareVersion: string;
}) => {
  const { theme, space } = useTheme();
  return (
    <Flex pt={6} alignItems="center">
      <Flex mb={9}>
        <Text fontWeight="semiBold" fontSize={7} textAlign="center">
          {t("FirmwareUpdate.pleaseConfirmUpdateOnYourDevice", {
            deviceName: getDeviceModel(device.modelId).productName,
          })}
        </Text>
      </Flex>

      <Flex flexDirection="row" justifyContent="center">
        <Flex borderRadius={4} px={3} py={1} backgroundColor="neutral.c40">
          <Text>V {currentFirmwareVersion}</Text>
        </Flex>
        <Flex px={space[2]} justifyContent="center">
          <ArrowRight size="S" />
        </Flex>
        <Flex borderRadius={4} px={3} py={1} backgroundColor="neutral.c40">
          <Text>V {newFirmwareVersion}</Text>
        </Flex>
      </Flex>

      <Animation
        source={getDeviceAnimation({
          modelId: device.modelId,
          key: "allowUpdate",
          theme,
        })}
        style={getDeviceAnimationStyles(device.modelId)}
      />
    </Flex>
  );
};

export const FinishFirmwareUpdate = ({ t, device }: { t: TFunction; device: Device }) => {
  const { theme } = useTheme();

  return (
    <Flex py={2}>
      <Flex>
        <Flex flexDirection="row" alignItems="center" mb={5}>
          <IconBadge iconSize={20} Icon={<Text fontSize={4}>1</Text>} mr={5} />
          <Text fontSize={4} flex={1}>
            {t("FirmwareUpdate.waitForInstallationToFinish", {
              deviceName: getDeviceModel(device.modelId).productName,
            })}
          </Text>
        </Flex>
        <Flex flexDirection="row" alignItems="center">
          <IconBadge iconSize={20} Icon={<Text fontSize={4}>2</Text>} mr={5} />
          <Text fontSize={4} flex={1}>
            {t("FirmwareUpdate.unlockDeviceToComplete", {
              deviceName: getDeviceModel(device.modelId).productName,
            })}
          </Text>
        </Flex>
      </Flex>
      <Flex alignItems="center">
        <Animation
          source={getDeviceAnimation({ modelId: device.modelId, key: "enterPinCode", theme })}
        />
      </Flex>
    </Flex>
  );
};

export const FirmwareUpdateDenied = ({
  t,
  device,
  newFirmwareVersion,
  onPressRestart,
  onPressQuit,
}: {
  t: TFunction;
  device: Device;
  newFirmwareVersion: string;
  onPressRestart: () => void;
  onPressQuit: () => void;
}) => {
  const drawerName = "Error: update cancelled on device";
  return (
    <Flex alignItems="center" justifyContent="center" px={1}>
      <TrackScreen category={drawerName} type="drawer" refreshSource={false} />
      <IconBadge iconColor="primary.c100" iconSize={32} Icon={IconsLegacy.InfoAltFillMedium} />
      <Text fontSize={7} fontWeight="semiBold" textAlign="center" mt={6}>
        {t("FirmwareUpdate.updateCancelled", {
          deviceName: getDeviceModel(device.modelId).productName,
        })}
      </Text>
      <Text fontSize={4} textAlign="center" color="neutral.c80" mt={6}>
        {t("FirmwareUpdate.updateCancelledDescription", {
          deviceName: getDeviceModel(device.modelId).productName,
          newFirmwareVersion,
        })}
      </Text>
      <Button
        type="main"
        event="button_clicked"
        eventProperties={{
          button: "Restart OS update",
          page: "Firmware update",
          drawer: drawerName,
        }}
        outline={false}
        onPress={onPressRestart}
        mt={8}
        mb={6}
        alignSelf="stretch"
      >
        {t("FirmwareUpdate.restartUpdate")}
      </Button>
      <Link
        event="button_clicked"
        eventProperties={{
          button: "Exit update",
          page: "Firmware update",
          drawer: drawerName,
        }}
        onPress={onPressQuit}
      >
        {t("FirmwareUpdate.quitUpdate")}
      </Link>
    </Flex>
  );
};

export const DeviceActionError = ({
  t,
  device,
  errorName,
  translationContext,
  children,
}: {
  t: TFunction;
  device: Device;
  errorName: string;
  translationContext?: string;
  children?: React.ReactNode;
}) => {
  const { errorTitle, errorDescription } = useMemo(() => {
    const contextSpecificErrorTitleId = `${translationContext}.errors.${errorName}.title`;
    const contextSpecificErrorDescriptionId = `${translationContext}.errors.${errorName}.description`;

    const genericErrorTitleId = `errors.${errorName}.title`;
    const genericErrorDescriptionId = `errors.${errorName}.description`;

    const contextSpecificErrorTitle = t(contextSpecificErrorTitleId, {
      deviceName: getDeviceModel(device.modelId).productName,
    });
    const contextSpecificErrorDescription = t(contextSpecificErrorDescriptionId, {
      deviceName: getDeviceModel(device.modelId).productName,
    });

    const genericErrorTitle = t(genericErrorTitleId, {
      deviceName: getDeviceModel(device.modelId).productName,
    });
    const genericErrorDescription = t(genericErrorDescriptionId, {
      deviceName: getDeviceModel(device.modelId).productName,
    });

    // this function returns the translated strings for the error's description and title
    // it gives priority to the translations that exists in the context that is passed as props
    // if there is no specific translation for the context it uses the the generic error translations
    // it also considers that there might not be a translated description for the error, in which case
    // it returns "null" for the description
    return {
      errorTitle:
        contextSpecificErrorTitle !== contextSpecificErrorTitleId
          ? contextSpecificErrorTitle
          : genericErrorTitle,
      errorDescription:
        contextSpecificErrorDescription !== contextSpecificErrorDescriptionId
          ? contextSpecificErrorDescription
          : genericErrorDescription !== genericErrorDescriptionId
            ? genericErrorDescription
            : null,
    };
  }, [translationContext, device.modelId, errorName, t]);

  return (
    <Flex alignItems="center" justifyContent="center" px={1}>
      <IconBadge iconColor="warning.c100" iconSize={32} Icon={IconsLegacy.WarningSolidMedium} />
      <Text fontSize={7} fontWeight="semiBold" textAlign="center" mt={6}>
        {errorTitle}
      </Text>
      {errorDescription && (
        <Text fontSize={4} textAlign="center" color="neutral.c80" mt={6}>
          {errorDescription}
        </Text>
      )}
      {children}
    </Flex>
  );
};
