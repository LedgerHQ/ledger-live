import React, { useCallback, useRef, useState } from "react";
import { Box, Flex, IconsLegacy, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { CropView } from "react-native-image-crop-tools";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ImageCropper, {
  Props as ImageCropperProps,
  CropResult,
} from "~/components/CustomImage/ImageCropper";
import { ImageDimensions } from "~/components/CustomImage/types";
import { targetDisplayDimensions } from "./shared";
import Button from "~/components/wrappedUi/Button";
import { ScreenName } from "~/const";
import BottomContainer from "~/components/CustomImage/BottomButtonsContainer";
import Touchable from "~/components/Touchable";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CustomImageNavigatorParamList } from "~/components/RootNavigator/types/CustomImageNavigator";
import { TrackScreen } from "~/analytics";
import { LayoutChangeEvent } from "react-native";

type NavigationProps = BaseComposite<
  StackNavigatorProps<CustomImageNavigatorParamList, ScreenName.CustomImageStep1Crop>
>;

const analyticsScreenName = "Crop or rotate picture";
const analyticsRotateEventProps = {
  button: "Rotate",
};
const analyticsConfirmProps = {
  button: "Confirm crop",
};

/**
 * UI component that loads the input image (from the route params) &
 * displays it in a cropping UI with a confirm button at the bottom.
 * Then on confirmation it navigates to the preview step with the cropped image
 * file URI as a param.
 */
const Step1Cropping = ({ navigation, route }: NavigationProps) => {
  const cropperRef = useRef<CropView>(null);
  const [rotated, setRotated] = useState(false);

  const { t } = useTranslation();

  const { params } = route;

  const { device, baseImageFile } = params;

  const handleError = useCallback(
    (error: Error) => {
      console.error(error);
      navigation.navigate(ScreenName.CustomImageErrorScreen, { error, device });
    },
    [navigation, device],
  );

  /** CROP IMAGE HANDLING */
  const handleCropResult: ImageCropperProps["onResult"] = useCallback(
    (cropResult: CropResult) => {
      navigation.navigate(ScreenName.CustomImageStep2Preview, {
        ...params,
        cropResult,
      });
    },
    [navigation, params],
  );

  const handlePressNext = useCallback(() => {
    cropperRef?.current?.saveImage(undefined, 100);
  }, [cropperRef]);

  const handlePressRotateLeft = useCallback(() => {
    if (cropperRef?.current) {
      cropperRef.current.rotateImage(false);
      setRotated(!rotated);
    }
  }, [cropperRef, rotated, setRotated]);

  const [containerDimensions, setContainerDimensions] = useState<ImageDimensions | null>(null);
  const onContainerLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setContainerDimensions({ height: layout.height, width: layout.width });
  }, []);

  const { bottom } = useSafeAreaInsets();

  return (
    <Flex
      flex={1}
      flexDirection="column"
      alignItems="center"
      /**
       * Using this value directly rather than the SafeAreaView prevents a
       * double initial rendering which can causes issues in the ImageCropper
       * component
       */
      paddingBottom={bottom}
    >
      <TrackScreen category={analyticsScreenName} />
      <Flex
        flex={1}
        onLayout={baseImageFile ? onContainerLayout : undefined}
        width="100%"
        justifyContent="center"
        alignItems="center"
      >
        {containerDimensions && baseImageFile ? (
          <ImageCropper
            ref={cropperRef}
            imageFileUri={baseImageFile.imageFileUri}
            aspectRatio={targetDisplayDimensions}
            /**
             * this native component needs absolute height & width values to
             * render properly
             * */
            style={containerDimensions}
            /**
             * remount if style dimensions changes as otherwise there is a
             * rendering issue on iOS
             * */
            key={`w:${containerDimensions.width};h:${containerDimensions.height}`}
            onError={handleError}
            onResult={handleCropResult}
          />
        ) : (
          <InfiniteLoader />
        )}
      </Flex>
      {baseImageFile ? (
        <BottomContainer>
          <Box mb={7} alignSelf="center">
            <Touchable
              onPress={handlePressRotateLeft}
              event="button_clicked"
              eventProperties={analyticsRotateEventProps}
            >
              <Flex
                py={4}
                px={6}
                borderRadius={100}
                backgroundColor="neutral.c30"
                flexDirection="row"
                justifyContent="center"
                alignItems="center"
              >
                <Text variant="paragraph" fontWeight="semiBold" mr={2} ml={2}>
                  {t("customImage.rotateImage")}
                </Text>
                <IconsLegacy.ReverseMedium size={16} />
              </Flex>
            </Touchable>
          </Box>
          <Flex flexDirection="row">
            <Button
              flex={1}
              type="main"
              size="large"
              onPress={handlePressNext}
              outline={false}
              event="button_clicked"
              eventProperties={analyticsConfirmProps}
            >
              {t("customImage.confirmCrop")}
            </Button>
          </Flex>
        </BottomContainer>
      ) : null}
    </Flex>
  );
};

export default Step1Cropping;
