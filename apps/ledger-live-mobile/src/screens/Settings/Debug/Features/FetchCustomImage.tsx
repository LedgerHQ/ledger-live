import React, { useRef, useEffect, useCallback, useState, ComponentProps } from "react";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Image, StyleSheet, View } from "react-native";
import { Text, Flex, Button } from "@ledgerhq/native-ui";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useSelector, useDispatch } from "react-redux";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { targetDisplayDimensions } from "../../../CustomImage/shared";
import { customImageBackupSelector } from "~/reducers/settings";
import { setCustomImageBackup } from "~/actions/settings";
import NavigationScrollView from "~/components/NavigationScrollView";
import SelectDevice from "~/components/SelectDevice";
import SelectDevice2, { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import CustomImageDeviceAction from "~/components/CustomImageDeviceAction";
import ImageHexProcessor from "~/components/CustomImage/ImageHexProcessor";
import { ProcessorPreviewResult } from "~/components/CustomImage/ImageProcessor";
import StaxFramedImage, { transferConfig } from "~/components/CustomImage/StaxFramedImage";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { ReactNavigationHeaderOptions } from "~/components/RootNavigator/types/helpers";
import { useStaxFetchImageDeviceAction } from "~/hooks/deviceActions";

// Defines here some of the header options for this screen to be able to reset back to them.
export const debugFetchCustomImageHeaderOptions: ReactNavigationHeaderOptions = {
  headerShown: true,
  title: "Debug FetchCustomImage",
  headerRight: () => null,
  headerLeft: () => <NavigationHeaderBackButton />,
};

export default function DebugFetchCustomImage() {
  const deviceAction = useStaxFetchImageDeviceAction();
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [device, setDevice] = useState<Device | null>(null);
  const [action, setAction] = useState<string>("");
  const [imageSource, setImageSource] = useState<ComponentProps<typeof Image>["source"]>();

  const { hash, hex } = useSelector(customImageBackupSelector) || {};
  const currentBackup = useRef<string>(hash || "");
  const dispatch = useDispatch();

  const newDeviceSelectionFeatureFlag = useFeature("llmNewDeviceSelection");

  // TODO move all the logic here onto its own thing
  // when we implement the screens of the flow.
  const status = deviceAction.useHook(action === "fetch" ? device : undefined, {
    backupHash: currentBackup.current,
    allowedEmpty: false,
  });

  const onReset = useCallback(() => {
    setDevice(null);
  }, []);

  const onRestore = useCallback(() => {
    setAction("restore");
  }, []);

  const onFetch = useCallback(() => {
    setAction("fetch");
  }, []);

  const onResult = useCallback(() => {
    // TS be happy please
  }, []);

  const onSkip = useCallback(() => {
    // TS be happy please
  }, []);

  const onDeleteBackup = useCallback(() => {
    dispatch(setCustomImageBackup({ hash: "", hex: "" }));
    currentBackup.current = "";
  }, [dispatch]);

  const handleImageSourceLoaded = useCallback((res: ProcessorPreviewResult) => {
    setImageSource({ uri: res.imageBase64DataUri });
  }, []);

  const { progress, fetchingImage, imageAlreadyBackedUp, imageFetched, hexImage, imgHash, error } =
    status;

  useEffect(() => {
    if (imgHash && hexImage) {
      dispatch(setCustomImageBackup({ hash: imgHash, hex: hexImage }));
    }
  }, [dispatch, imgHash, hexImage]);

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
          newDeviceSelectionFeatureFlag?.enabled ? (
            <SelectDevice2
              onSelect={setDevice}
              requestToSetHeaderOptions={requestToSetHeaderOptions}
            />
          ) : (
            <SelectDevice onSelect={setDevice} />
          )
        ) : null}
        <Flex>
          {hash ? (
            <Button mb={2} onPress={onDeleteBackup} type="main">
              {"Delete backup"}
            </Button>
          ) : null}
          {device ? (
            !action ? (
              <>
                <Button onPress={onFetch} mb={2} type="main">
                  {"Conditionally fetch"}
                </Button>
                {hex ? (
                  <Button onPress={onRestore} type="main">
                    {"Restore backup"}
                  </Button>
                ) : null}
              </>
            ) : action === "fetch" ? (
              <>
                <Button onPress={onReset} type="main">
                  {"Reset"}
                </Button>
                {fetchingImage && progress ? (
                  <Text variant="bodyLineHeight">{`Backing up image ${progress}`}</Text>
                ) : fetchingImage && !progress ? (
                  <Text variant="bodyLineHeight">{"Fetch current hash"}</Text>
                ) : imageAlreadyBackedUp ? (
                  <Text variant="bodyLineHeight">{"No need to backup"}</Text>
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
            ) : hex ? (
              <CustomImageDeviceAction
                device={device}
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
        {hex ? (
          <>
            <ImageHexProcessor
              hexData={hex as string}
              {...targetDisplayDimensions}
              onPreviewResult={handleImageSourceLoaded}
              onError={() => console.error(error)}
            />
            {imageSource ? (
              <Flex flexDirection="row" flexGrow={0}>
                <StaxFramedImage frameConfig={transferConfig} source={imageSource} />
              </Flex>
            ) : null}
          </>
        ) : null}
      </View>
    </NavigationScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    padding: 16,
  },
  box: {
    padding: 10,
  },
});
