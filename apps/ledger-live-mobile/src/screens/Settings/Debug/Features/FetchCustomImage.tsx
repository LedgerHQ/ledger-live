import React, { useEffect, useCallback, useState, ComponentProps, useMemo } from "react";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Image, StyleSheet, View } from "react-native";
import { Text, Flex, Button } from "@ledgerhq/native-ui";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  getScreenSpecs,
  getScreenVisibleAreaDimensions,
  isCustomLockScreenSupported,
} from "@ledgerhq/live-common/device/use-cases/screenSpecs";
import { DeviceModelId } from "@ledgerhq/types-devices";
import NavigationScrollView from "~/components/NavigationScrollView";
import SelectDevice2, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import CustomImageDeviceAction from "~/components/CustomLockScreenDeviceAction";
import ImageHexProcessor from "~/components/CustomImage/dithering/ImageFromDeviceProcessor";
import { ProcessorPreviewResult } from "~/components/CustomImage/dithering/types";
import FramedPicture from "~/components/CustomImage/FramedPicture";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { ReactNavigationHeaderOptions } from "~/components/RootNavigator/types/helpers";
import { useFetchImageDeviceAction } from "~/hooks/deviceActions";

// Defines here some of the header options for this screen to be able to reset back to them.
export const debugFetchCustomImageHeaderOptions: ReactNavigationHeaderOptions = {
  headerShown: true,
  title: "Debug FetchCustomImage",
  headerRight: () => null,
  headerLeft: () => <NavigationHeaderBackButton />,
};

export default React.memo(function DebugFetchCustomImage() {
  const fetchDeviceAction = useFetchImageDeviceAction();
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [device, setDevice] = useState<Device | null>(null);
  const [action, setAction] = useState<string>("");
  const [imageSource, setImageSource] = useState<ComponentProps<typeof Image>["source"]>();

  const clsDeviceModelId =
    device?.modelId && isCustomLockScreenSupported(device?.modelId)
      ? device.modelId
      : DeviceModelId.stax;

  // TODO move all the logic here onto its own thing
  // when we implement the screens of the flow.

  const fetchImageRequest = useMemo(
    () => ({
      allowedEmpty: false,
      deviceModelId: clsDeviceModelId,
    }),
    [clsDeviceModelId],
  );

  const fetchStatus = fetchDeviceAction.useHook(
    action === "fetch" ? device : undefined,
    fetchImageRequest,
  );

  const onReset = useCallback(() => {
    setDevice(null);
    setAction("");
  }, []);

  const onFetch = useCallback(() => {
    setAction("fetch");
  }, []);

  const onResult = useCallback(() => {}, []);

  const onSkip = useCallback(() => {}, []);

  const handleImageSourceLoaded = useCallback((res: ProcessorPreviewResult) => {
    setImageSource({ uri: res.imageBase64DataUri });
  }, []);

  const { progress, fetchingImage, imageAlreadyBackedUp, imageFetched, hexImage, imgHash, error } =
    fetchStatus;

  const [hash, setHash] = useState<string | null>(null);
  const [hex, setHex] = useState<string | null>(null);

  useEffect(() => {
    if (imgHash && hexImage) {
      setHash(imgHash);
      setHex(hexImage);
    }
  }, [imgHash, hexImage]);

  const requestToSetHeaderOptions = useCallback(
    (request: SetHeaderOptionsRequest) => {
      if (request.type === "set") {
        navigation.setOptions({
          headerLeft: request.options.headerLeft,
          headerRight: request.options.headerRight,
        });
      } else {
        // Sets back the header to its initial values set for this screen
        navigation.setOptions({
          headerLeft: () => null,
          headerRight: () => null,
          ...debugFetchCustomImageHeaderOptions,
        });
      }
    },
    [navigation],
  );

  return (
    <NavigationScrollView>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {!device ? (
          <SelectDevice2
            onSelect={setDevice}
            requestToSetHeaderOptions={requestToSetHeaderOptions}
          />
        ) : null}
        <Flex>
          {device ? (
            !action ? (
              <>
                <Button onPress={onFetch} mb={2} type="main">
                  {"Fetch image"}
                </Button>
              </>
            ) : action === "fetch" ? (
              <>
                <Button onPress={onReset} type="main">
                  {"Reset selected device"}
                </Button>
                {fetchingImage && progress ? (
                  <Text variant="bodyLineHeight">{`Backing up image ${progress}`}</Text>
                ) : fetchingImage && !progress ? (
                  <Text variant="bodyLineHeight">{"Fetch current hash"}</Text>
                ) : imageAlreadyBackedUp ? (
                  <Text variant="bodyLineHeight">
                    {"Image already backed up, no need to backup"}
                  </Text>
                ) : imageFetched ? (
                  <Text variant="bodyLineHeight">{"Completed backup"}</Text>
                ) : error ? (
                  <Text variant="bodyLineHeight">{error?.message || error?.name}</Text>
                ) : hash ? (
                  <Text variant="bodyLineHeight">{"Compare against backup"}</Text>
                ) : (
                  <Text variant="bodyLineHeight">{"Something else"}</Text>
                )}
              </>
            ) : hex && device.modelId ? (
              <CustomImageDeviceAction
                device={device}
                deviceModelId={clsDeviceModelId}
                hexImage={hex}
                onResult={onResult}
                onSkip={onSkip}
                source={imageSource}
              />
            ) : null
          ) : null}
          <Text mt={3} variant="bodyLineHeight">
            {hash ? `Current backup hash '${hash}'` : "No backup available"}
          </Text>
        </Flex>
        {hex && device?.modelId ? (
          <>
            <ImageHexProcessor
              hexData={hex}
              {...getScreenVisibleAreaDimensions(clsDeviceModelId)}
              bitsPerPixel={getScreenSpecs(clsDeviceModelId).bitsPerPixel}
              onPreviewResult={handleImageSourceLoaded}
              onError={() => console.error(error)}
            />
            {imageSource ? (
              <Flex flexDirection="row" flexGrow={0}>
                <FramedPicture deviceModelId={clsDeviceModelId} source={imageSource} />
              </Flex>
            ) : null}
          </>
        ) : null}
      </View>
    </NavigationScrollView>
  );
});

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    padding: 16,
  },
  box: {
    padding: 10,
  },
});
