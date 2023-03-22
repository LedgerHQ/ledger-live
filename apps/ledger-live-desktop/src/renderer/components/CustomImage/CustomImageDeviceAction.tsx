import React, { useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setLastSeenCustomImage, clearLastSeenCustomImage } from "~/renderer/actions/settings";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { createAction } from "@ledgerhq/live-common/hw/actions/staxLoadImage";
import { ImageLoadRefusedOnDevice, ImageCommitRefusedOnDevice } from "@ledgerhq/live-common/errors";
import withRemountableWrapper from "@ledgerhq/live-common/hoc/withRemountableWrapper";
import { getEnv } from "@ledgerhq/live-common/env";
import { useTranslation } from "react-i18next";
import { Theme, Flex, Icons, Link } from "@ledgerhq/react-ui";
import useTheme from "~/renderer/hooks/useTheme";
import { DeviceActionDefaultRendering } from "../DeviceAction";
import Button from "../ButtonV3";
import {
  renderError,
  renderImageCommitRequested,
  renderImageLoadRequested,
  renderLoadingImage,
} from "../DeviceAction/rendering";
import staxLoadImage from "@ledgerhq/live-common/hw/staxLoadImage";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { DeviceModelId } from "@ledgerhq/types-devices";

type Props = {
  device?: Device | null | undefined;
  hexImage: string;
  source: HTMLImageElement["src"];
  onStart?: () => void;
  onResult?: () => void;
  onSkip?: () => void;
  onTryAnotherImage: () => void;
  blockNavigation?: (blocked: boolean) => void;
};

const action = createAction(getEnv("MOCK") ? mockedEventEmitter : staxLoadImage);
const mockedDevice = { deviceId: "", modelId: DeviceModelId.stax, wired: true };

const CustomImageDeviceAction: React.FC<Props> = withRemountableWrapper(props => {
  const {
    hexImage,
    onStart,
    onResult,
    onSkip,
    source,
    remountMe,
    onTryAnotherImage,
    blockNavigation,
  } = props;
  const type: Theme["theme"] = useTheme("colors.palette.type");
  const device = getEnv("MOCK") ? mockedDevice : props.device;
  const commandRequest = hexImage;

  const { t } = useTranslation();
  const dispatch = useDispatch();

  const validDevice = device?.modelId === DeviceModelId.stax ? device : null;
  const status = action?.useHook(validDevice, commandRequest);
  const payload = action?.mapResult(status);

  useEffect(() => {
    if (onStart && validDevice) {
      onStart();
    }
  }, [onStart, validDevice]);

  const handleResult = useCallback(
    lastSeenCustomImage => {
      if (onResult && validDevice) {
        dispatch(setLastSeenCustomImage(lastSeenCustomImage));
        onResult();
      }
    },
    [dispatch, onResult, validDevice],
  );

  const { error, imageLoadRequested, loadingImage, imageCommitRequested, progress } = status;
  const isError = !!error;
  const isRefusedOnStaxError =
    error instanceof ImageLoadRefusedOnDevice || error instanceof ImageCommitRefusedOnDevice;

  useEffect(() => {
    // Once transferred the old image is wiped, we need to clear it from the data.
    if (error instanceof ImageCommitRefusedOnDevice) {
      dispatch(clearLastSeenCustomImage());
    }
  }, [dispatch, error]);

  const shouldNavBeBlocked = !!validDevice && !isError;
  useEffect(() => {
    blockNavigation && blockNavigation(shouldNavBeBlocked);
  }, [shouldNavBeBlocked, blockNavigation]);

  const handleRetry = useCallback(() => {
    if (isRefusedOnStaxError) onTryAnotherImage();
    else remountMe();
  }, [isRefusedOnStaxError, onTryAnotherImage, remountMe]);

  return (
    <Flex flexDirection="column" flex={1} justifyContent="center">
      {imageLoadRequested && device ? (
        renderImageLoadRequested({ t, device, type })
      ) : loadingImage && device ? (
        renderLoadingImage({ t, device, progress, source })
      ) : imageCommitRequested && device ? (
        renderImageCommitRequested({ t, device, source, type })
      ) : isError ? (
        <Flex flexDirection="column" alignItems="center">
          {renderError({
            t,
            error,
            device: device ?? undefined,
            ...(isRefusedOnStaxError
              ? { Icon: Icons.CircledAlertMedium, iconColor: "warning.c100" }
              : {}),
          })}
          <Button size="large" variant="main" outline={false} onClick={handleRetry}>
            {isRefusedOnStaxError
              ? t("customImage.steps.transfer.uploadAnotherImage")
              : t("common.retry")}
          </Button>
          {isRefusedOnStaxError ? (
            <Flex py={7}>
              <Link onClick={onSkip}>{t("customImage.steps.transfer.doThisLater")}</Link>
            </Flex>
          ) : null}
        </Flex>
      ) : (
        <DeviceActionDefaultRendering
          overridesPreferredDeviceModel={DeviceModelId.stax}
          status={status}
          request={commandRequest}
          payload={payload}
          onResult={handleResult}
        />
      )}
    </Flex>
  );
});

export default CustomImageDeviceAction;
