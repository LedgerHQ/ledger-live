import React, { ComponentProps, useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Image } from "react-native";
import { Flex, Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import withRemountableWrapper from "@ledgerhq/live-common/hoc/withRemountableWrapper";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ImageLoadRefusedOnDevice, ImageCommitRefusedOnDevice } from "@ledgerhq/live-common/errors";
import { setLastSeenCustomImage, clearLastSeenCustomImage } from "~/actions/settings";
import { DeviceActionDefaultRendering } from "../DeviceAction";
import { ImageSourceContext } from "../CustomImage/FramedPicture";
import { renderError } from "../DeviceAction/rendering";
import CustomImageBottomModal from "../CustomImage/CustomImageBottomModal";
import Button from "../wrappedUi/Button";
import Link from "../wrappedUi/Link";
import { screen, TrackScreen } from "~/analytics";
import { useStaxLoadImageDeviceAction } from "~/hooks/deviceActions";
import { SettingsSetLastSeenCustomImagePayload } from "~/actions/types";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import {
  RenderImageCommitRequested,
  RenderImageLoadRequested,
  RenderLoadingImage,
} from "./stepsRendering";

type Props = {
  device: Device;
  deviceModelId: CLSSupportedDeviceModelId;
  hexImage: string;
  source?: ComponentProps<typeof Image>["source"];
  onStart?: () => void;
  onResult?: ({ imageHash, imageSize }: { imageHash: string; imageSize: number }) => void;
  onSkip?: () => void;
};

const analyticsScreenNameRefusedOnStax = "Lock screen cancelled on device";
const analyticsRefusedOnStaxUploadAnotherEventProps = {
  button: "Upload another image",
};
const analyticsRefusedOnStaxDoThisLaterEventProps = {
  button: "Do this later",
};
const analyticsErrorTryAgainEventProps = {
  button: "Try again",
};

const CustomImageDeviceAction: React.FC<Props & { remountMe: () => void }> = ({
  device,
  deviceModelId,
  hexImage,
  onStart,
  onResult,
  onSkip,
  source,
  remountMe,
}) => {
  const action = useStaxLoadImageDeviceAction();
  const commandRequest = useMemo(() => ({ hexImage, deviceModelId }), [hexImage, deviceModelId]);

  const { t } = useTranslation();
  const dispatch = useDispatch();

  const status = action?.useHook(device, commandRequest);
  const payload = action?.mapResult(status);

  useEffect(() => {
    if (onStart && device) {
      onStart();
    }
  }, [onStart, device]);

  const [isModalOpened, setIsModalOpened] = useState(false);

  const closeModal = useCallback(() => {
    setIsModalOpened(false);
  }, [setIsModalOpened]);

  const openModal = useCallback(() => {
    setIsModalOpened(true);
  }, [setIsModalOpened]);

  const handleResult = useCallback(
    (lastSeenCustomImage: SettingsSetLastSeenCustomImagePayload) => {
      screen("The lock screen has successfully loaded");
      dispatch(setLastSeenCustomImage(lastSeenCustomImage));
      onResult && onResult(lastSeenCustomImage);
    },
    [dispatch, onResult],
  );

  const {
    error: CLSError,
    imageCommitRequested,
    imageLoadRequested,
    loadingImage,
    progress,
  } = status;
  const [error, setError] = useState<null | Error>(null);
  useEffect(() => {
    if (CLSError) {
      setError(CLSError);
    }
  }, [CLSError]);
  const isError = !!error;
  const isRefusedOnStaxError =
    (error as unknown) instanceof ImageLoadRefusedOnDevice ||
    (error as unknown) instanceof ImageCommitRefusedOnDevice;

  useEffect(() => {
    // Once transferred the old image is wiped, we need to clear it from the data.
    if (error instanceof ImageCommitRefusedOnDevice) {
      dispatch(clearLastSeenCustomImage());
    }
  }, [dispatch, error]);

  const handleRetry = useCallback(() => {
    if (isRefusedOnStaxError) openModal();
    else remountMe();
  }, [isRefusedOnStaxError, remountMe, openModal]);

  const trackScreenName = isError
    ? isRefusedOnStaxError
      ? analyticsScreenNameRefusedOnStax
      : "Error: " + error.name
    : undefined;

  return (
    <ImageSourceContext.Provider value={{ source }}>
      {trackScreenName ? <TrackScreen category={trackScreenName} /> : null}
      <Flex flexDirection="column" flex={1} alignSelf="stretch">
        {isError ? (
          <Flex flex={1}>
            {renderError({
              t,
              error,
              device,
              ...(isRefusedOnStaxError
                ? { Icon: Icons.Warning, iconColor: "warning.c60", hasExportLogButton: false }
                : {}),
            })}
            {}
            <Button
              size="large"
              type="main"
              outline={false}
              onPress={handleRetry}
              event="button_clicked"
              eventProperties={
                isRefusedOnStaxError
                  ? analyticsRefusedOnStaxUploadAnotherEventProps
                  : analyticsErrorTryAgainEventProps
              }
            >
              {isRefusedOnStaxError ? t("customImage.uploadAnotherImage") : t("common.retry")}
            </Button>
            {isRefusedOnStaxError ? (
              <Flex py={7}>
                <Link
                  size="large"
                  onPress={onSkip}
                  event="button_clicked"
                  eventProperties={analyticsRefusedOnStaxDoThisLaterEventProps}
                >
                  {t("customImage.doThisLater")}
                </Link>
              </Flex>
            ) : null}
          </Flex>
        ) : imageLoadRequested && device ? (
          <RenderImageLoadRequested device={device} deviceModelId={deviceModelId} />
        ) : loadingImage && device && typeof progress === "number" ? (
          <RenderLoadingImage device={device} progress={progress} deviceModelId={deviceModelId} />
        ) : imageCommitRequested && device ? (
          <RenderImageCommitRequested device={device} deviceModelId={deviceModelId} />
        ) : (
          <DeviceActionDefaultRendering
            status={status}
            device={device}
            request={commandRequest}
            payload={payload}
            onResult={handleResult}
          />
        )}
      </Flex>
      <CustomImageBottomModal
        isOpened={isModalOpened}
        onClose={closeModal}
        device={device}
        deviceModelId={deviceModelId}
      />
    </ImageSourceContext.Provider>
  );
};

export default withRemountableWrapper(CustomImageDeviceAction);
