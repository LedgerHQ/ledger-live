import React, { useCallback } from "react";
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

type NavigationProps = BaseComposite<
  StackNavigatorProps<
    CustomImageNavigatorParamList,
    ScreenName.CustomImagePreviewPostEdit
  >
>;

const PreviewPostEdit = ({ navigation, route }: NavigationProps) => {
  const { t } = useTranslation();
  const { params } = route;
  const { baseImageFile, imagePreview, imageData, device } = params;

  const handleError = useCallback(
    (error: Error) => {
      console.error(error);
      navigation.navigate(ScreenName.CustomImageErrorScreen, { error, device });
    },
    [navigation, device],
  );

  const handleSetPicture = useCallback(() => {
    if (!imagePreview) {
      /**
       * this should not happen as the "request raw result" button is only
       * visible once the preview is there
       * */
      throw new ImagePreviewError();
    }
    navigation.navigate(ScreenName.CustomImageStep3Transfer, {
      rawData: imageData,
      previewData: imagePreview,
      device,
    });
  }, [navigation, device, imagePreview, imageData]);

  const handlePreviewImageError = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<ImageErrorEventData>) => {
      console.error(nativeEvent.error);
      handleError(new ImagePreviewError());
    },
    [handleError],
  );

  const handleEditPicture = useCallback(() => {
    navigation.navigate(NavigatorName.CustomImage, {
      screen: ScreenName.CustomImageStep1Crop,
      params: {
        device,
        baseImageFile,
        isPictureFromGallery: false,
      },
    });
  }, [navigation, device, baseImageFile]);

  if (!imagePreview) {
    return <InfiniteLoader />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Flex flex={1}>
        <Flex flex={1}>
          <Flex
            flex={1}
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
          >
            <FramedImage
              onError={handlePreviewImageError}
              fadeDuration={0}
              source={{ uri: imagePreview?.imageBase64DataUri }}
            />
          </Flex>
        </Flex>
        <Flex px={8}>
          <Button type="main" size="large" mb={4} onPress={handleSetPicture}>
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
