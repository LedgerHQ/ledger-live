import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { useTheme } from "styled-components/native";
import { Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import {
  NFTMetadataLoadingError,
  ImagePreviewError,
} from "@ledgerhq/live-common/customImage/errors";
import { NativeSyntheticEvent, ImageErrorEventData, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import {
  EventListenerCallback,
  EventMapCore,
  StackNavigationState,
  useFocusEffect,
} from "@react-navigation/native";
import { StackNavigationEventMap } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNftMetadata } from "@ledgerhq/live-nft-react";
import { NFTResource } from "@ledgerhq/live-nft/types";
import { NFTMetadata } from "@ledgerhq/types-live";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { getDeviceModel } from "@ledgerhq/devices";
import { getScreenVisibleAreaDimensions } from "@ledgerhq/live-common/device/use-cases/screenSpecs";
import {
  CLSSupportedDeviceModelId,
  supportedDeviceModelIds,
} from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";

import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CustomImageNavigatorParamList } from "~/components/RootNavigator/types/CustomImageNavigator";
import { NavigatorName, ScreenName } from "~/const";
import {
  downloadImageToFile,
  extractImageUrlFromNftMetadata,
  importImageFromPhoneGallery,
} from "~/components/CustomImage/imageUtils";
import { ImageFileUri } from "~/components/CustomImage/types";
import FramedPicture from "~/components/CustomImage/FramedPicture";
import ImageProcessor, {
  Props as ImageProcessorProps,
  ProcessorPreviewResult,
  ProcessorRawResult,
} from "~/components/CustomImage/ImageProcessor";
import useCenteredImage, {
  Params as ImageCentererParams,
  CenteredResult,
} from "~/components/CustomImage/useCenteredImage";
import Button from "~/components/wrappedUi/Button";
import { TrackScreen } from "~/analytics";
import Link from "~/components/wrappedUi/Link";
import { getFramedPictureConfig } from "~/components/CustomImage/framedPictureConfigs";

const DEFAULT_CONTRAST = 1;

type NavigationProps = BaseComposite<
  StackNavigatorProps<CustomImageNavigatorParamList, ScreenName.CustomImagePreviewPreEdit>
>;

const analyticsScreenName = "Preview of the lockscreen picture";
const analyticsSetLockScreenEventProps = {
  button: "Set as lock screen",
};
const analyticsEditEventProps = {
  button: "Edit",
};

const TabContainer = styled(Flex).attrs({
  mx: 11,
  mt: 6,
  p: 1,
  columnGap: 1,
  borderRadius: "9px",
  backgroundColor: "neutral.c30",
  flexDirection: "row",
  flexGrow: 0,
  alignSelf: "center",
})``;

function Tab({
  isActive,
  onPress,
  children,
}: {
  isActive: boolean;
  onPress(): void;
  children: string;
}): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={{ width: "50%" }}>
      <Flex backgroundColor={isActive ? "neutral.c50" : "transparent"} borderRadius={"8px"} p={3}>
        <Text
          variant={"paragraph"}
          fontWeight={"semiBold"}
          color={isActive ? "palette.neutral.c100" : "palette.neutral.c70"}
          textAlign={"center"}
        >
          {children}
        </Text>
      </Flex>
    </Pressable>
  );
}

const PreviewPreEdit = ({ navigation, route }: NavigationProps) => {
  const { t } = useTranslation();
  const [loadedImage, setLoadedImage] = useState<ImageFileUri | null>(null);
  const { params } = route;
  const { isPictureFromGallery, device, isStaxEnabled } = params;
  const [deviceModelId, setSelectedDeviceModelId] = useState<CLSSupportedDeviceModelId>(
    params.deviceModelId ?? DeviceModelId.stax,
  );

  const targetDisplayDimensions = useMemo(
    () => getScreenVisibleAreaDimensions(deviceModelId),
    [deviceModelId],
  );
  const { colors } = useTheme();
  const theme = colors.type as "light" | "dark";

  const isNftMetadata = "nftMetadataParams" in params;
  const isImageUrl = "imageUrl" in params;
  const isImageFileUri = "imageFileUri" in params;

  const nftMetadataParams = isNftMetadata ? params.nftMetadataParams : [];

  const forceDefaultNavigationBehaviour = useRef(false);
  const navigateToErrorScreen = useCallback(
    (error: Error, device: Device) => {
      forceDefaultNavigationBehaviour.current = true;
      navigation.replace(ScreenName.CustomImageErrorScreen, { error, device, deviceModelId });
    },
    [navigation, deviceModelId],
  );

  const handleError = useCallback(
    (error: Error) => {
      console.error(error);
      navigateToErrorScreen(error, device);
    },
    [navigateToErrorScreen, device],
  );

  const [contract, tokenId, currencyId] = nftMetadataParams;
  const nftMetadata = useNftMetadata(contract, tokenId, currencyId);

  const { status, metadata } = nftMetadata as NFTResource & {
    metadata: NFTMetadata;
  };

  const isStaxEnabledImage = !!isStaxEnabled || !!metadata?.staxImage;
  const imageType = isStaxEnabledImage
    ? "staxEnabledImage"
    : isNftMetadata
      ? "originalNFTImage"
      : "customImage";

  const nftImageUri = extractImageUrlFromNftMetadata(metadata);

  const imageFileUri = isImageFileUri ? params.imageFileUri : undefined;
  const imageUrl = nftImageUri || (isImageUrl ? params.imageUrl : undefined);

  useEffect(() => {
    if (isNftMetadata && ["nodata", "error"].includes(status)) {
      console.error("Nft metadata loading status", status);
      navigateToErrorScreen(new NFTMetadataLoadingError(status), device);
    }
  }, [device, isNftMetadata, navigateToErrorScreen, navigation, status]);

  /** LOAD SOURCE IMAGE FROM PARAMS */
  useEffect(() => {
    let dead = false;
    if (imageFileUri) {
      setLoadedImage({
        imageFileUri,
      });
    } else if (imageUrl) {
      if (isNftMetadata && ["loading", "queued"].includes(status)) {
        return () => {
          dead = true;
        };
      }
      const { resultPromise, cancel } = downloadImageToFile({ imageUrl });
      resultPromise
        .then(res => {
          if (!dead) setLoadedImage(res);
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
  }, [handleError, imageFileUri, imageUrl, status, isNftMetadata]);

  /** IMAGE RESIZING */

  const [croppedImage, setCroppedImage] = useState<CenteredResult | null>(null);

  const handleResizeError = useCallback(
    (error: Error) => {
      navigateToErrorScreen(error, device);
    },
    [navigateToErrorScreen, device],
  );

  const handleResizeResult: ImageCentererParams["onResult"] = useCallback(
    (res: CenteredResult) => {
      setCroppedImage(res);
    },
    [setCroppedImage],
  );

  useCenteredImage({
    targetDimensions: targetDisplayDimensions,
    imageUri: imageUrl || loadedImage?.imageFileUri,
    onError: handleResizeError,
    onResult: handleResizeResult,
  });

  /** RESULT IMAGE HANDLING */

  const [previewLoading, setPreviewLoading] = useState<boolean>(true);
  const [processorPreviewImage, setProcessorPreviewImage] = useState<ProcessorPreviewResult | null>(
    null,
  );
  const [rawResultLoading, setRawResultLoading] = useState(false);
  const imageProcessorRef = useRef<ImageProcessor>(null);

  const handlePreviewResult: ImageProcessorProps["onPreviewResult"] = useCallback(
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
        imageType,
        deviceModelId,
      });
      setRawResultLoading(false);
    },
    [navigation, setRawResultLoading, processorPreviewImage, device, imageType, deviceModelId],
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

  /**
   * Handling "back press/back gesture" navigation event so that in case
   * the image was imported from the phone's gallery, we show the native image
   * picker before navigating back to the previous screen.
   * This ensures that the navigation flow is fully bidirectional so it feels
   * natural to the user:
   * screen with "import from gallery button" <-> gallery picker <-> this screen
   * */
  useFocusEffect(
    useCallback(() => {
      let dead = false;
      const listener: EventListenerCallback<
        StackNavigationEventMap & EventMapCore<StackNavigationState<CustomImageNavigatorParamList>>,
        "beforeRemove"
      > = e => {
        if (forceDefaultNavigationBehaviour.current || !isPictureFromGallery) {
          navigation.dispatch(e.data.action);
          return;
        }
        e.preventDefault();
        setLoadedImage(null);
        setCroppedImage(null);
        setProcessorPreviewImage(null);
        setPreviewLoading(true);
        importImageFromPhoneGallery()
          .then(importResult => {
            if (dead) return;
            if (importResult !== null) {
              setLoadedImage(importResult);
            } else {
              navigation.dispatch(e.data.action);
            }
          })
          .catch(e => {
            if (dead) return;
            handleError(e);
          });
      };
      const removeListener = navigation.addListener("beforeRemove", listener);
      return () => {
        dead = true;
        removeListener();
      };
    }, [navigation, handleError, isPictureFromGallery]),
  );

  const handleEditPicture = useCallback(() => {
    if (!loadedImage) {
      /**
       * this should not happen as the "request raw result" button is only
       * visible once the preview is there
       * */
      throw new ImagePreviewError();
    }

    navigation.navigate(NavigatorName.CustomImage, {
      screen: ScreenName.CustomImageStep1Crop,
      params: {
        device,
        baseImageFile: loadedImage,
        imageType,
        deviceModelId,
      },
    });
  }, [navigation, device, loadedImage, imageType, deviceModelId]);

  const resetPreview = useCallback(() => {
    setCroppedImage(null);
    setPreviewLoading(true);
    setProcessorPreviewImage(null);
  }, []);

  const onChangeDeviceModelId = useCallback(
    (deviceModelId: CLSSupportedDeviceModelId) => {
      setSelectedDeviceModelId(deviceModelId);
      resetPreview();
    },
    [resetPreview],
  );

  if (!loadedImage || !loadedImage.imageFileUri) {
    return (
      <Flex flex={1} justifyContent="center" alignItems="center">
        <InfiniteLoader />
      </Flex>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <TrackScreen category={analyticsScreenName} />
      {!params.deviceModelId && (
        <TabContainer>
          {supportedDeviceModelIds.map(modelId => (
            <Tab
              key={modelId}
              onPress={() => onChangeDeviceModelId(modelId)}
              isActive={modelId === deviceModelId}
            >
              {getDeviceModel(modelId)?.productName}
            </Tab>
          ))}
        </TabContainer>
      )}
      {croppedImage?.imageBase64DataUri && (
        <ImageProcessor
          ref={imageProcessorRef}
          imageBase64DataUri={croppedImage?.imageBase64DataUri}
          onPreviewResult={handlePreviewResult}
          onError={handleError}
          onRawResult={handleRawResult}
          contrast={DEFAULT_CONTRAST}
        />
      )}
      {previewLoading ? (
        <Flex flex={1} justifyContent="center" alignItems="center">
          <InfiniteLoader />
          <Text variant="body" color="neutral.c80" mt={6}>
            {t("customImage.preview.loading")}
          </Text>
        </Flex>
      ) : (
        <Flex flex={1}>
          <Flex flex={1}>
            <Flex flex={1} flexDirection="column" alignItems="center" justifyContent="center">
              <FramedPicture
                onError={handlePreviewImageError}
                fadeDuration={0}
                source={{ uri: processorPreviewImage?.imageBase64DataUri }}
                framedPictureConfig={getFramedPictureConfig("preview", deviceModelId, theme)}
              />
            </Flex>
          </Flex>
          <Flex pb={8} px={8}>
            <Button
              type="main"
              size="large"
              outline
              mb={7}
              disabled={previewLoading}
              pending={rawResultLoading}
              onPress={requestRawResult}
              displayContentWhenPending
              event="button_clicked"
              eventProperties={analyticsSetLockScreenEventProps}
            >
              {t("customImage.preview.setPicture")}
            </Button>
            <Link
              size="large"
              onPress={handleEditPicture}
              disabled={!loadedImage || previewLoading || isStaxEnabledImage}
              event="button_clicked"
              eventProperties={analyticsEditEventProps}
            >
              {t("customImage.preview.editPicture")}
            </Link>
          </Flex>
        </Flex>
      )}
    </SafeAreaView>
  );
};

export default PreviewPreEdit;
