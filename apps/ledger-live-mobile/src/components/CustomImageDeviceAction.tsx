import React, { ComponentProps, useCallback, useEffect, useState } from "react";
import { Image } from "react-native";
import { Link, Flex, Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import withRemountableWrapper from "@ledgerhq/live-common/hoc/withRemountableWrapper";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { createAction } from "@ledgerhq/live-common/hw/actions/ftsLoadImage";
import loadImage from "@ledgerhq/live-common/hw/ftsLoadImage";
import {
  ImageLoadRefusedOnDevice,
  ImageCommitRefusedOnDevice,
} from "@ledgerhq/live-common/errors";
import { DeviceActionDefaultRendering } from "./DeviceAction";
import { ImageSourceContext } from "./CustomImage/FramedImage";
import { renderError } from "./DeviceAction/rendering";
import CustomImageBottomModal from "./CustomImage/CustomImageBottomModal";
import Button from "./Button";

type Props = {
  device: Device;
  hexImage: string;
  source?: ComponentProps<typeof Image>["source"];
  onStart?: () => void;
  onResult?: () => void;
  onSkip?: () => void;
};

const errorNamesRetryAnotherImage = [
  ImageLoadRefusedOnDevice().name,
  ImageCommitRefusedOnDevice().name,
];

const action = createAction(loadImage);

const CustomImageDeviceAction: React.FC<Props & { remountMe: () => void }> = ({
  device,
  hexImage,
  onStart,
  onResult,
  onSkip,
  source,
  remountMe,
}) => {
  const commandRequest = hexImage;

  const { t } = useTranslation();

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

  const { error } = status;
  const isError = !!error;
  const isRefusedOnStaxError =
    error?.name && errorNamesRetryAnotherImage.includes(error?.name);

  const handleRetry = useCallback(() => {
    if (isRefusedOnStaxError) openModal();
    else remountMe();
  }, [isRefusedOnStaxError, remountMe, openModal]);

  return (
    <ImageSourceContext.Provider value={{ source }}>
      <Flex flexDirection="column" flex={1} alignSelf="stretch">
        {isError ? (
          <Flex flex={1}>
            {renderError({
              t,
              error,
              device,
              ...(isRefusedOnStaxError
                ? { Icon: Icons.CircledAlertMedium, iconColor: "warning.c100" }
                : {}),
            })}
            <Button
              size="large"
              type="main"
              outline={false}
              onPress={handleRetry}
            >
              {isRefusedOnStaxError
                ? t("customImage.uploadAnotherImage")
                : t("common.retry")}
            </Button>
            {isRefusedOnStaxError ? (
              <Flex py={7}>
                <Link size="large" onPress={onSkip}>
                  {t("customImage.doThisLater")}
                </Link>
              </Flex>
            ) : null}
          </Flex>
        ) : (
          <DeviceActionDefaultRendering
            status={status}
            device={device}
            request={commandRequest}
            payload={payload}
            onResult={onResult}
          />
        )}
      </Flex>
      <CustomImageBottomModal
        isOpened={isModalOpened}
        onClose={closeModal}
        device={device}
      />
    </ImageSourceContext.Provider>
  );
};

export default withRemountableWrapper(CustomImageDeviceAction);
