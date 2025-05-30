import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { ImageDoesNotExistOnDevice } from "@ledgerhq/live-common/errors";
import { NavigatorName, ScreenName } from "~/const";
import QueuedDrawer, { Props as BottomModalProps } from "../QueuedDrawer";
import ModalChoice from "./ModalChoice";
import { importImageFromPhoneGallery } from "./imageUtils";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { TrackScreen } from "~/analytics";
import DeviceAction from "../DeviceAction";
import { useStaxRemoveImageDeviceAction } from "~/hooks/deviceActions";
import { type CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

const analyticsDrawerName = "Choose an image to set as your device lockscreen";

const analyticsButtonChoosePhoneGalleryEventProps = {
  button: "Choose from my picture gallery",
  drawer: analyticsDrawerName,
};

const analyticsButtonChooseNFTGalleryEventProps = {
  button: "Choose from NFT gallery",
  drawer: analyticsDrawerName,
};

type Props = {
  isOpened?: boolean;
  onClose: BottomModalProps["onClose"];
  setDeviceHasImage?: (arg0: boolean) => void;
  deviceHasImage?: boolean;
  device: Device | null;
  deviceModelId: CLSSupportedDeviceModelId | null;
  referral?: string;
};

const CustomImageBottomModal: React.FC<Props> = props => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRemovingCustomImage, setIsRemovingCustomImage] = useState(false);
  const {
    isOpened,
    onClose,
    device,
    deviceHasImage,
    setDeviceHasImage,
    deviceModelId,
    referral = undefined,
  } = props;
  const { t } = useTranslation();
  const { pushToast } = useToasts();
  const llNftSupportEnabled = useFeature("llNftSupport")?.enabled ?? false;

  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();

  const handleUploadFromPhone = useCallback(async () => {
    try {
      setIsLoading(true);
      const importResult = await importImageFromPhoneGallery();
      if (importResult !== null) {
        navigation.navigate(NavigatorName.CustomImage, {
          screen: ScreenName.CustomImagePreviewPreEdit,
          params: {
            ...importResult,
            isPictureFromGallery: true,
            device,
            deviceModelId,
            referral: referral,
          },
        });
      }
    } catch (error) {
      console.error(error);
      navigation.navigate(NavigatorName.CustomImage, {
        screen: ScreenName.CustomImageErrorScreen,
        params: { error: error as Error, device, deviceModelId },
      });
    }
    setIsLoading(false);
    onClose && onClose();
  }, [navigation, onClose, device, deviceModelId, referral]);

  const handleSelectFromNFTGallery = useCallback(() => {
    navigation.navigate(NavigatorName.CustomImage, {
      screen: ScreenName.CustomImageNFTGallery,
      params: { device, deviceModelId },
    });
    onClose && onClose();
  }, [navigation, device, onClose, deviceModelId]);

  const request = useMemo(() => ({ deviceId: device?.deviceId || "", request: {} }), [device]);

  useEffect(() => {
    return () => {
      setIsRemovingCustomImage(false);
    };
  }, []);

  const wrappedOnClose = useCallback(() => {
    setIsRemovingCustomImage(false);
    onClose && onClose();
  }, [onClose]);

  const onSuccess = useCallback(() => {
    setIsRemovingCustomImage(false);
    if (setDeviceHasImage) {
      setDeviceHasImage(false);
    }
    wrappedOnClose();
    pushToast({
      id: "customImage.remove",
      type: "success",
      icon: "success",
      title: t("customImage.toastRemove"),
    });
  }, [setDeviceHasImage, wrappedOnClose, pushToast, t]);

  const onError = useCallback(
    (error: Error) => {
      if (error instanceof ImageDoesNotExistOnDevice) {
        if (setDeviceHasImage) {
          setDeviceHasImage(false);
        }
      }
    },
    [setDeviceHasImage],
  );

  const action = useStaxRemoveImageDeviceAction();

  return (
    <QueuedDrawer
      isRequestingToBeOpened={!!isOpened}
      onClose={wrappedOnClose}
      preventBackdropClick={isRemovingCustomImage}
    >
      <TrackScreen category={analyticsDrawerName} type="drawer" refreshSource={false} />
      {isRemovingCustomImage && device ? (
        <Flex alignItems="center">
          <Flex flexDirection="row">
            <DeviceAction
              device={device}
              request={request}
              action={action}
              onResult={onSuccess}
              onError={onError}
              location={
                referral === HOOKS_TRACKING_LOCATIONS.myLedgerDashboard
                  ? HOOKS_TRACKING_LOCATIONS.myLedgerDashboard
                  : undefined
              }
            />
          </Flex>
        </Flex>
      ) : isLoading ? (
        <Flex m={10}>
          <InfiniteLoader />
        </Flex>
      ) : (
        <>
          <ModalChoice
            onPress={handleUploadFromPhone}
            title={t("customImage.drawer.options.uploadFromPhone")}
            iconName={"Upload"}
            event="button_clicked"
            eventProperties={analyticsButtonChoosePhoneGalleryEventProps}
          />
          <Flex mt={6} />
          {llNftSupportEnabled ? (
            <ModalChoice
              onPress={handleSelectFromNFTGallery}
              title={t("customImage.drawer.options.selectFromNFTGallery")}
              iconName={"Ticket"}
              event="button_clicked"
              eventProperties={analyticsButtonChooseNFTGalleryEventProps}
            />
          ) : null}
          {deviceHasImage ? (
            <Button
              mt={6}
              type="error"
              iconName="Trash"
              iconPosition="right"
              outline
              onPress={() => setIsRemovingCustomImage(true)}
            >
              {t("customImage.drawer.options.remove")}
            </Button>
          ) : null}
        </>
      )}
    </QueuedDrawer>
  );
};

export default CustomImageBottomModal;
