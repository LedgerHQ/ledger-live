import React, { useCallback, useEffect, useRef, useState } from "react";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { ImagePreviewError } from "@ledgerhq/live-common/customImage/errors";
import { NativeSyntheticEvent, ImageErrorEventData } from "react-native";

import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { CustomImageNavigatorParamList } from "../../components/RootNavigator/types/CustomImageNavigator";
import { ScreenName } from "../../const";
import { downloadImageToFile } from "../../components/CustomImage/imageUtils";
import { ImageFileUri } from "../../components/CustomImage/types";
import { targetDimensions } from "./shared";
import FramedImage from "../../components/CustomImage/FramedImage";
import ImageProcessor, {
  Props as ImageProcessorProps,
  ProcessorPreviewResult,
  ProcessorRawResult,
} from "../../components/CustomImage/ImageProcessor";
import useCenteredImage, {
  Params as ImageCentererParams,
  CenteredResult,
} from "../../components/CustomImage/useCenteredImage";

type NavigationProps = BaseComposite<
  StackNavigatorProps<
    CustomImageNavigatorParamList,
    ScreenName.CustomImagePreviewPreEdit
  >
>;

const PreviewPreEdit = ({ navigation, route }: NavigationProps) => {
  const [imageToCrop, setImageToCrop] = useState<ImageFileUri | null>(null);
  const { params } = route;
  const { device } = params;

  const handleError = useCallback(
    (error: Error) => {
      console.error(error);
      navigation.navigate(ScreenName.CustomImageErrorScreen, { error, device });
    },
    [navigation, device],
  );

  /** LOAD SOURCE IMAGE FROM PARAMS */
  useEffect(() => {
    let dead = false;
    if ("imageFileUri" in params) {
      setImageToCrop({
        imageFileUri: params.imageFileUri,
      });
    } else {
      const { resultPromise, cancel } = downloadImageToFile(params);
      resultPromise
        .then(res => {
          if (!dead) setImageToCrop(res);
        })
        .catch(e => {
          if (!dead) handleError(e);
        });
      return () => {
        dead = true;
        cancel();
      };
    }
    return () => {
      dead = true;
    };
  }, [params, setImageToCrop, handleError]);

  const [resizedImage, setResizedImage] = useState<CenteredResult | null>(null);

  const handleResizeError = useCallback(
    (error: Error) => {
      console.error(error);
      navigation.navigate(ScreenName.CustomImageErrorScreen, { error, device });
    },
    [navigation, device],
  );

  /** IMAGE RESIZING */

  const handleResizeResult: ImageCentererParams["onResult"] = useCallback(
    (res: CenteredResult) => {
      setResizedImage(res);
    },
    [setResizedImage],
  );

  useCenteredImage({
    targetDimensions,
    imageFileUri: imageToCrop?.imageFileUri,
    onError: handleResizeError,
    onResult: handleResizeResult,
  });

  /** RESULT IMAGE HANDLING */

  const [loading, setLoading] = useState<boolean>(false);
  const [contrast, setContrast] = useState(1);
  const [processorPreviewImage, setProcessorPreviewImage] =
    useState<ProcessorPreviewResult | null>(null);
  const [rawResultLoading, setRawResultLoading] = useState(false);
  const imageProcessorRef = useRef<ImageProcessor>(null);

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

  if (!imageToCrop || !imageToCrop.imageFileUri) {
    return <InfiniteLoader />;
  }

  return (
    <Flex height="100%" flex={1}>
      <Flex flex={1}>
        {resizedImage?.imageBase64DataUri && (
          <ImageProcessor
            ref={imageProcessorRef}
            imageBase64DataUri={resizedImage?.imageBase64DataUri}
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
    </Flex>
  );
};

export default PreviewPreEdit;
