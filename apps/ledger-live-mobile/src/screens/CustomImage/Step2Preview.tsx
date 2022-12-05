import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import { Button, Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import {
  Image,
  ImageErrorEventData,
  NativeSyntheticEvent,
  Pressable,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImagePreviewError } from "@ledgerhq/live-common/customImage/errors";
import useResizedImage, {
  Params as ImageResizerParams,
  ResizeResult,
} from "../../components/CustomImage/useResizedImage";
import ImageProcessor, {
  Props as ImageProcessorProps,
  ProcessorPreviewResult,
  ProcessorRawResult,
} from "../../components/CustomImage/ImageProcessor";
import { targetDimensions } from "./shared";
import BottomButtonsContainer from "../../components/CustomImage/BottomButtonsContainer";
import ContrastChoice from "../../components/CustomImage/ContrastChoice";
import { ScreenName } from "../../const";
import { CustomImageNavigatorParamList } from "../../components/RootNavigator/types/CustomImageNavigator";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import ForceTheme from "../../components/theme/ForceTheme";

export const PreviewImage = styled.Image.attrs({
  resizeMode: "contain",
})`
  align-self: center;
  width: 200px;
  height: 200px;
`;

const contrasts = [
  {
    val: 1,
    color: { topLeft: "neutral.c40", bottomRight: "neutral.c30" },
  },
  {
    val: 1.5,
    color: { topLeft: "neutral.c50", bottomRight: "neutral.c30" },
  },
  {
    val: 2,
    color: { topLeft: "neutral.c60", bottomRight: "neutral.c30" },
  },
  {
    val: 3,
    color: { topLeft: "neutral.c70", bottomRight: "neutral.c30" },
  },
];

type NavigationProps = BaseComposite<
  StackNavigatorProps<
    CustomImageNavigatorParamList,
    ScreenName.CustomImageStep2Preview
  >
>;

/**
 * UI component that loads the input image (from the route params) &
 * displays it in a preview UI with some contrast options & a confirm button at
 * the bottom.
 * Then on confirmation it navigates to the transfer step with the raw hex data
 * of the image & the preview base 64 data URI of the image as params.
 */
const Step2Preview = ({ navigation, route }: NavigationProps) => {
  const imageProcessorRef = useRef<ImageProcessor>(null);
  const [loading, setLoading] = useState(true);
  const [resizedImage, setResizedImage] = useState<ResizeResult | null>(null);
  const initialIndex = 0;
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const animSelectedIndex = useSharedValue(initialIndex);
  const [processorPreviewImage, setProcessorPreviewImage] =
    useState<ProcessorPreviewResult | null>(null);
  const [rawResultLoading, setRawResultLoading] = useState(false);

  const { t } = useTranslation();

  const { params } = route;

  const { cropResult: croppedImage, device, baseImageFile } = params;

  const handleError = useCallback(
    (error: Error) => {
      console.error(error);
      navigation.navigate(ScreenName.CustomImageErrorScreen, { error, device });
    },
    [navigation, device],
  );

  /** IMAGE RESIZING */

  const handleResizeResult: ImageResizerParams["onResult"] = useCallback(
    (res: ResizeResult) => {
      setResizedImage(res);
    },
    [setResizedImage],
  );

  useResizedImage({
    targetDimensions,
    imageFileUri: croppedImage?.imageFileUri,
    onError: handleError,
    onResult: handleResizeResult,
  });

  /** RESULT IMAGE HANDLING */

  const handlePreviewResult: ImageProcessorProps["onPreviewResult"] =
    useCallback(
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
      });
      setRawResultLoading(false);
    },
    [
      navigation,
      setRawResultLoading,
      processorPreviewImage,
      device,
      baseImageFile,
    ],
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
    newIndex => {
      setSelectedIndex(newIndex);
      animSelectedIndex.value = withTiming(newIndex, { duration: 300 });
    },
    [animSelectedIndex],
  );

  const leftBoxAnimatedStyle = useAnimatedStyle(() => ({
    width: (3 - animSelectedIndex.value) * 54,
  }));

  const rightBoxAnimatedStyle = useAnimatedStyle(() => ({
    width: animSelectedIndex.value * 54,
  }));

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
      {resizedImage?.imageBase64DataUri && (
        <ImageProcessor
          ref={imageProcessorRef}
          imageBase64DataUri={resizedImage?.imageBase64DataUri}
          onPreviewResult={handlePreviewResult}
          onError={handleError}
          onRawResult={handleRawResult}
          contrast={contrasts[selectedIndex].val}
        />
      )}
      <Flex
        flex={1}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        {processorPreviewImage?.imageBase64DataUri ? (
          <Image
            style={{ width: 252, height: 406 }}
            onError={handlePreviewImageError}
            fadeDuration={0}
            source={{ uri: processorPreviewImage.imageBase64DataUri }}
          />
        ) : (
          <InfiniteLoader />
        )}
      </Flex>
      <BottomButtonsContainer>
        {resizedImage?.imageBase64DataUri && (
          <ForceTheme selectedPalette="dark">
            <Flex flexDirection="row" my={6}>
              <Animated.View style={leftBoxAnimatedStyle} />
              {contrasts.map(({ val, color }, index, arr) => (
                <Pressable
                  disabled={loading}
                  key={val}
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
                    color={color}
                    isFirst={index === 0}
                    isLast={index === arr.length - 1}
                  />
                </Pressable>
              ))}
              <Animated.View style={rightBoxAnimatedStyle} />
            </Flex>
          </ForceTheme>
        )}
        <Flex width="100%">
          <Button
            disabled={!processorPreviewImage?.imageBase64DataUri}
            mt={6}
            size="large"
            type="main"
            outline={false}
            onPress={requestRawResult}
            pending={rawResultLoading}
            displayContentWhenPending
          >
            {t("common.confirm")}
          </Button>
        </Flex>
      </BottomButtonsContainer>
    </SafeAreaView>
  );
};

export default Step2Preview;
