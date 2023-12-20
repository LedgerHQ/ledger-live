import React, { useEffect, useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { setLastSeenCustomImage, clearLastSeenCustomImage } from "~/renderer/actions/settings";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { createAction } from "@ledgerhq/live-common/hw/actions/staxLoadImage";
import { ImageLoadRefusedOnDevice, ImageCommitRefusedOnDevice } from "@ledgerhq/live-common/errors";
import withRemountableWrapper from "@ledgerhq/live-common/hoc/withRemountableWrapper";
import { getEnv } from "@ledgerhq/live-env";
import { useTranslation } from "react-i18next";
import { Theme, Flex, IconsLegacy } from "@ledgerhq/react-ui";
import useTheme from "~/renderer/hooks/useTheme";
import { DeviceActionDefaultRendering } from "../DeviceAction";
import Button from "../ButtonV3";
import {
  DeviceActionErrorComponent,
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
  padImage?: boolean;
  source: HTMLImageElement["src"];
  inlineRetry?: boolean;
  restore?: boolean;
  onError?: (arg0: Error) => void;
  onStart?: () => void;
  onResult?: () => void;
  onSkip?: () => void;
  onTryAnotherImage: () => void;
  blockNavigation?: (blocked: boolean) => void;
};

const action = createAction(getEnv("MOCK") ? mockedEventEmitter : staxLoadImage);
const mockedDevice = { deviceId: "", modelId: DeviceModelId.stax, wired: true };

function checkIfIsRefusedOnStaxError(e: unknown): boolean {
  return e instanceof ImageLoadRefusedOnDevice || e instanceof ImageCommitRefusedOnDevice;
}

const CustomImageDeviceAction: React.FC<Props> = withRemountableWrapper(props => {
  const {
    hexImage,
    onStart,
    onResult,
    onSkip,
    source,
    remountMe,
    onTryAnotherImage,
    onError,
    blockNavigation,
    padImage,
    inlineRetry = true,
    restore = false,
  } = props;
  const type: Theme["theme"] = useTheme().colors.palette.type;
  const device = getEnv("MOCK") ? mockedDevice : props.device;
  const commandRequest = useMemo(() => ({ hexImage, padImage }), [hexImage, padImage]);

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
    (lastSeenCustomImage: { imageSize: number; imageHash: string }) => {
      if (onResult && validDevice) {
        dispatch(setLastSeenCustomImage(lastSeenCustomImage));
        onResult();
      }
    },
    [dispatch, onResult, validDevice],
  );

  const { error, imageLoadRequested, loadingImage, imageCommitRequested, progress } = status;
  const isError = !!error;
  const isRefusedOnStaxError = checkIfIsRefusedOnStaxError(error);

  useEffect(() => {
    if (!error) return;
    // Once transferred the old image is wiped, we need to clear it from the data.
    if (error instanceof ImageCommitRefusedOnDevice) {
      dispatch(clearLastSeenCustomImage());
    }
    onError && onError(error);
  }, [dispatch, error, onError]);

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
        renderImageLoadRequested({ t, device, type, restore })
      ) : loadingImage && device ? (
        renderLoadingImage({ t, device, progress, source })
      ) : imageCommitRequested && device ? (
        renderImageCommitRequested({ t, device, source, type, restore })
      ) : isError ? (
        <Flex flexDirection="column" alignItems="center">
          <DeviceActionErrorComponent
            error={error}
            device={device ?? undefined}
            {...(isRefusedOnStaxError
              ? { Icon: IconsLegacy.CircledAlertMedium, iconColor: "warning.c50" }
              : {})}
          />
          {inlineRetry ? (
            <Button size="large" variant="main" outline={false} onClick={handleRetry}>
              {isRefusedOnStaxError
                ? t("customImage.steps.transfer.uploadAnotherImage")
                : t("common.retry")}
            </Button>
          ) : null}
          {isRefusedOnStaxError ? (
            <Button size="large" onClick={onSkip}>
              {t("customImage.steps.transfer.doThisLater")}
            </Button>
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
