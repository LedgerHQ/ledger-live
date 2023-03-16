import React, { useCallback } from "react";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { ImagePreviewError } from "@ledgerhq/live-common/customImage/errors";
import { NativeSyntheticEvent, ImageErrorEventData } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/wrappedUi/Button";

import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { CustomImageNavigatorParamList } from "../../components/RootNavigator/types/CustomImageNavigator";
import { NavigatorName, ScreenName } from "../../const";
import FramedImage, {
  previewConfig,
} from "../../components/CustomImage/FramedImage";
import { TrackScreen } from "../../analytics";
import Link from "../../components/wrappedUi/Link";

type NavigationProps = BaseComposite<
  StackNavigatorProps<
    CustomImageNavigatorParamList,
    ScreenName.CustomImagePreviewPostEdit
  >
>;

const analyticsScreenName = "Preview of the lockscreen picture";
const analyticsSetLockScreenEventProps = {
  button: "Set as lock screen",
};
const analyticsEditEventProps = {
  button: "Edit",
};

const PreviewPostEdit = ({ navigation, route }: NavigationProps) => {
  const { t } = useTranslation();
  const { params } = route;
  const { baseImageFile, imagePreview, imageData, device, imageType } = params;

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
      imageType,
    });
  }, [navigation, device, imagePreview, imageData, imageType]);

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
        imageType,
      },
    });
  }, [navigation, device, baseImageFile, imageType]);

  if (!imagePreview) {
    return <InfiniteLoader />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <TrackScreen category={analyticsScreenName} />
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
              frameConfig={previewConfig}
            />
          </Flex>
        </Flex>
        <Flex pb={8} px={8}>
          <Button
            type="main"
            size="large"
            outline={false}
            mb={7}
            onPress={handleSetPicture}
            event="button_clicked"
            eventProperties={analyticsSetLockScreenEventProps}
          >
            {t("customImage.preview.setPicture")}
          </Button>
          <Link
            size="large"
            onPress={handleEditPicture}
            event="button_clicked"
            eventProperties={analyticsEditEventProps}
          >
            {t("customImage.preview.editPicture")}
          </Link>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
};

export default PreviewPostEdit;
