import React, { ComponentProps, useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Image } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import withRemountableWrapper from "@ledgerhq/live-common/hoc/withRemountableWrapper";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { createAction } from "@ledgerhq/live-common/hw/actions/staxLoadImage";
import loadImage from "@ledgerhq/live-common/hw/staxLoadImage";
import {
  ImageLoadRefusedOnDevice,
  ImageCommitRefusedOnDevice,
} from "@ledgerhq/live-common/errors";
import {
  setLastSeenCustomImage,
  clearLastSeenCustomImage,
} from "../actions/settings";
import { DeviceActionDefaultRendering } from "./DeviceAction";
import { ImageSourceContext } from "./CustomImage/FramedImage";
import CustomImageBottomModal from "./CustomImage/CustomImageBottomModal";
import { screen, TrackScreen } from "../analytics";
import GenericErrorView from "./GenericErrorView";

type Props = {
  device: Device;
  hexImage: string;
  source?: ComponentProps<typeof Image>["source"];
  onStart?: () => void;
  onResult?: ({
    imageHash,
    imageSize,
  }: {
    imageHash: string;
    imageSize: number;
  }) => void;
  onSkip?: () => void;
};

const analyticsScreenNameRefusedOnStax = "Lock screen cancelled on Ledger Stax";
const action = createAction(loadImage);

const CustomImageDeviceAction: React.FC<Props & { remountMe: () => void }> = ({
  device,
  hexImage,
  onStart,
  onResult,
  // onSkip, // TODO it's not up to the error screen to handle the skip
  source,
  remountMe,
}) => {
  const commandRequest = hexImage;

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
    lastSeenCustomImage => {
      screen("The lock screen has successfully loaded");
      dispatch(setLastSeenCustomImage(lastSeenCustomImage));
      onResult && onResult(lastSeenCustomImage);
    },
    [dispatch, onResult],
  );

  const { error } = status;
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

  const extraErrorArgs = {
    deviceName: device.deviceName || "",
    modelId: device.modelId,
  };

  return (
    <ImageSourceContext.Provider value={{ source }}>
      {trackScreenName ? <TrackScreen category={trackScreenName} /> : null}
      <Flex flexDirection="column" flex={1} alignSelf="stretch">
        {isError ? (
          <GenericErrorView
            error={error}
            args={extraErrorArgs}
            onPrimaryPress={handleRetry}
          />
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
      />
    </ImageSourceContext.Provider>
  );
};

export default withRemountableWrapper(CustomImageDeviceAction);
