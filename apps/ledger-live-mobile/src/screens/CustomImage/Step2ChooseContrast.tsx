import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { Image, ImageErrorEventData, NativeSyntheticEvent, Pressable } from "react-native";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImagePreviewError } from "@ledgerhq/live-common/customImage/errors";
import {
  getScreenSpecs,
  getScreenVisibleAreaDimensions,
} from "@ledgerhq/live-common/device/use-cases/screenSpecs";
import useResizedImage, {
  Params as ImageResizerParams,
  ResizeResult,
} from "~/components/CustomImage/useResizedImage";
import ImageProcessor, {
  Props as ImageProcessorProps,
} from "~/components/CustomImage/dithering/ImageToDeviceProcessor";
import {
  ProcessorPreviewResult,
  ProcessorRawResult,
} from "~/components/CustomImage/dithering/types";
import {
  mapDitheringConfigKeyToConfig,
  mapDitheringConfigKeyToAppearance,
  getAvailableDitheringConfigKeys,
} from "~/components/CustomImage/dithering/config";
import Button from "~/components/wrappedUi/Button";
import BottomButtonsContainer from "~/components/CustomImage/BottomButtonsContainer";
import ContrastChoice from "~/components/CustomImage/ContrastChoice";
import { ScreenName } from "~/const";
import { CustomImageNavigatorParamList } from "~/components/RootNavigator/types/CustomImageNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { TrackScreen } from "~/analytics";

export const PreviewImage = styled.Image.attrs({
  resizeMode: "contain",
})`
  align-self: center;
  width: 200px;
  height: 200px;
`;

const previewDimensions = {
  height: 406,
  width: 252,
};

const analyticsScreenName = "Choose contrast";

type NavigationProps = BaseComposite<
  StackNavigatorProps<CustomImageNavigatorParamList, ScreenName.CustomImageStep2ChooseContrast>
>;

/**
 * UI component that loads the input image (from the route params) &
 * displays it in a preview UI with some contrast options & a confirm button at
 * the bottom.
 * Then on confirmation it navigates to the transfer step with the raw hex data
 * of the image & the preview base 64 data URI of the image as params.
 */
const Step2ChooseContrast = ({ navigation, route }: NavigationProps) => {
  const imageProcessorRef = useRef<ImageProcessor>(null);
  const [loading, setLoading] = useState(true);
  const [resizedImage, setResizedImage] = useState<ResizeResult | null>(null);

  const { t } = useTranslation();
  const { params } = route;
  const { cropResult: croppedImage, device, deviceModelId, baseImageFile, imageType } = params;

  const bitsPerPixel = getScreenSpecs(deviceModelId).bitsPerPixel;
  const availableDitheringConfigKeys = useMemo(
    () => getAvailableDitheringConfigKeys(bitsPerPixel),
    [bitsPerPixel],
  );

  const initialIndex = 0;
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const animSelectedIndex = useSharedValue(initialIndex);
  const [processorPreviewImage, setProcessorPreviewImage] = useState<ProcessorPreviewResult | null>(
    null,
  );
  const [rawResultLoading, setRawResultLoading] = useState(false);

  const handleError = useCallback(
    (error: Error) => {
      console.error(error);
      navigation.navigate(ScreenName.CustomImageErrorScreen, { error, device, deviceModelId });
    },
    [navigation, device, deviceModelId],
  );

  /** IMAGE RESIZING */

  const handleResizeResult: ImageResizerParams["onResult"] = useCallback(
    (res: ResizeResult) => {
      setResizedImage(res);
    },
    [setResizedImage],
  );

  const screenVisibleAreaDimensions = getScreenVisibleAreaDimensions(deviceModelId);

  useResizedImage({
    targetDimensions: screenVisibleAreaDimensions,
    imageFileUri: croppedImage?.imageFileUri,
    onError: handleError,
    onResult: handleResizeResult,
  });

  /** RESULT IMAGE HANDLING */

  const handlePreviewResult: ImageProcessorProps["onPreviewResult"] = useCallback(
    data => {
      setProcessorPreviewImage(data);
      setLoading(false);
    },
    [setProcessorPreviewImage],
  );

  const handleRawResult: ImageProcessorProps["onRawResult"] = useCallback(
    (data: ProcessorRawResult) => {
      if (!processorPreviewImage) {
        /**
         * this should not happen as the "request raw result" button is only
         * visible once the preview is there
         * */
        throw new ImagePreviewError();
      }
      navigation.navigate(ScreenName.CustomImagePreviewPostEdit, {
        imageData: data,
        imagePreview: processorPreviewImage,
        baseImageFile,
        device,
        deviceModelId,
        imageType,
      });
      setRawResultLoading(false);
    },
    [processorPreviewImage, navigation, baseImageFile, device, deviceModelId, imageType],
  );

  const handlePreviewImageError = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<ImageErrorEventData>) => {
      console.error(nativeEvent.error);
      handleError(new ImagePreviewError());
    },
    [handleError],
  );

  const requestRawResult = useCallback(() => {
    imageProcessorRef?.current?.requestRawResult();
    setRawResultLoading(true);
  }, [imageProcessorRef, setRawResultLoading]);

  const setSelectedIndexWrapped = useCallback(
    (newIndex: number) => {
      setSelectedIndex(newIndex);
      animSelectedIndex.value = withTiming(newIndex, { duration: 300 });
    },
    [animSelectedIndex],
  );

  const confirmEventProperties = useMemo(
    () => ({
      button: "Confirm contrast",
      contrast:
        mapDitheringConfigKeyToConfig[availableDitheringConfigKeys[selectedIndex]].contrastValue,
      ditheringAlgorithm:
        mapDitheringConfigKeyToConfig[availableDitheringConfigKeys[selectedIndex]].algorithm,
    }),
    [selectedIndex, availableDitheringConfigKeys],
  );

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, justifyContent: "space-between" }}>
      <TrackScreen category={analyticsScreenName} />
      {resizedImage?.imageBase64DataUri && (
        <ImageProcessor
          ref={imageProcessorRef}
          imageBase64DataUri={resizedImage?.imageBase64DataUri}
          onPreviewResult={handlePreviewResult}
          onError={handleError}
          onRawResult={handleRawResult}
          contrast={
            mapDitheringConfigKeyToConfig[availableDitheringConfigKeys[selectedIndex]].contrastValue
          }
          ditheringAlgorithm={
            mapDitheringConfigKeyToConfig[availableDitheringConfigKeys[selectedIndex]].algorithm
          }
          bitsPerPixel={bitsPerPixel}
        />
      )}
      <Flex
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height={previewDimensions.height}
      >
        {processorPreviewImage?.imageBase64DataUri ? (
          <Image
            style={{
              width: previewDimensions.width,
              height:
                (screenVisibleAreaDimensions.height / screenVisibleAreaDimensions.width) *
                previewDimensions.width,
              borderRadius: 8,
            }}
            resizeMode="contain"
            onError={handlePreviewImageError}
            fadeDuration={0}
            source={{ uri: processorPreviewImage.imageBase64DataUri }}
          />
        ) : (
          <InfiniteLoader />
        )}
      </Flex>
      {resizedImage?.imageBase64DataUri && (
        <Flex flexDirection="row" my={6} justifyContent="center" alignItems="center">
          {availableDitheringConfigKeys.map((configKey, index, arr) => {
            const appearance = mapDitheringConfigKeyToAppearance[configKey];
            return (
              <Pressable
                disabled={loading}
                key={configKey}
                onPress={() => {
                  if (selectedIndex !== index) {
                    setLoading(true);
                    setSelectedIndexWrapped(index);
                  }
                }}
              >
                <ContrastChoice
                  selected={selectedIndex === index}
                  loading={loading}
                  appearance={appearance}
                  isFirst={index === 0}
                  isLast={index === arr.length - 1}
                />
              </Pressable>
            );
          })}
        </Flex>
      )}
      <BottomButtonsContainer style={{ paddingTop: 0 }}>
        <Flex width="100%">
          <Button
            disabled={!processorPreviewImage?.imageBase64DataUri}
            size="large"
            type="main"
            outline={false}
            onPress={requestRawResult}
            pending={rawResultLoading}
            displayContentWhenPending
            event="button_clicked"
            eventProperties={confirmEventProperties}
          >
            {t("customImage.confirmContrast")}
          </Button>
        </Flex>
      </BottomButtonsContainer>
    </SafeAreaView>
  );
};

export default Step2ChooseContrast;
