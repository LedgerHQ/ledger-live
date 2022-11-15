import React, { useCallback, useRef, useState } from "react";
import { Button, Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { ImagePreviewError } from "@ledgerhq/live-common/customImage/errors";
import { NativeSyntheticEvent, ImageErrorEventData } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { CustomImageNavigatorParamList } from "../../components/RootNavigator/types/CustomImageNavigator";
import { NavigatorName, ScreenName } from "../../const";
import FramedImage from "../../components/CustomImage/FramedImage";
import ImageProcessor, {
  Props as ImageProcessorProps,
  ProcessorPreviewResult,
  ProcessorRawResult,
} from "../../components/CustomImage/ImageProcessor";

type NavigationProps = BaseComposite<
  StackNavigatorProps<
    CustomImageNavigatorParamList,
    ScreenName.CustomImagePreviewPostEdit
  >
>;

const PreviewPostEdit = ({ navigation, route }: NavigationProps) => {
  const { t } = useTranslation();
  const { params } = route;
  const { image, contrast, device } = params;

  const handleError = useCallback(
    (error: Error) => {
      console.error(error);
      navigation.navigate(ScreenName.CustomImageErrorScreen, { error, device });
    },
    [navigation, device],
  );

  const [previewLoading, setPreviewLoading] = useState<boolean>(true);
  const [processorPreviewImage, setProcessorPreviewImage] =
    useState<ProcessorPreviewResult | null>(null);
  const [rawResultLoading, setRawResultLoading] = useState(false);
  const imageProcessorRef = useRef<ImageProcessor>(null);

  const handlePreviewResult: ImageProcessorProps["onPreviewResult"] =
    useCallback(
      data => {
        setProcessorPreviewImage(data);
        setPreviewLoading(false);
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
      navigation.navigate(ScreenName.CustomImageStep3Transfer, {
        rawData: data,
        previewData: processorPreviewImage,
        device,
      });
      setRawResultLoading(false);
    },
    [navigation, setRawResultLoading, processorPreviewImage, device],
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

  const handleEditPicture = useCallback(() => {
    navigation.navigate(NavigatorName.CustomImage, {
      screen: ScreenName.CustomImageStep1Crop,
      params: {
        ...params,
        isPictureFromGallery: false,
      },
    });
  }, [navigation, params]);

  if (!image) {
    return <InfiniteLoader />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Flex flex={1}>
        <Flex flex={1}>
          {image?.imageBase64DataUri && (
            <ImageProcessor
              ref={imageProcessorRef}
              imageBase64DataUri={image?.imageBase64DataUri}
              onPreviewResult={handlePreviewResult}
              onError={handleError}
              onRawResult={handleRawResult}
              contrast={contrast}
            />
          )}
          <Flex
            flex={1}
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
          >
            <FramedImage
              onError={handlePreviewImageError}
              fadeDuration={0}
              source={{ uri: processorPreviewImage?.imageBase64DataUri }}
            />
          </Flex>
        </Flex>
        <Flex px={8}>
          <Button
            type="main"
            outline
            size="large"
            mb={4}
            disabled={previewLoading}
            pending={rawResultLoading}
            displayContentWhenPending
            onPress={requestRawResult}
          >
            {t("customImage.preview.setPicture")}
          </Button>
          <Button mb={8} size="large" onPress={handleEditPicture}>
            {t("customImage.preview.editPicture")}
          </Button>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
};

export default PreviewPostEdit;
