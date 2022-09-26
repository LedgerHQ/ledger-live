import React, { useCallback, useEffect, useRef, useState } from "react";
import { Flex, Icons, InfiniteLoader } from "@ledgerhq/native-ui";
import { CropView } from "react-native-image-crop-tools";
import { useTranslation } from "react-i18next";
import {
  StackNavigationEventMap,
  StackScreenProps,
} from "@react-navigation/stack";
import {
  EventListenerCallback,
  EventMapCore,
  StackNavigationState,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import ImageCropper, {
  Props as ImageCropperProps,
  CropResult,
} from "../../components/CustomImage/ImageCropper";
import {
  ImageDimensions,
  ImageFileUri,
} from "../../components/CustomImage/types";
import {
  downloadImageToFile,
  importImageFromPhoneGallery,
} from "../../components/CustomImage/imageUtils";
import { targetDimensions } from "./shared";
import Button from "../../components/Button";
import { ScreenName } from "../../const";
import BottomContainer from "../../components/CustomImage/BottomButtonsContainer";
import Touchable from "../../components/Touchable";
import { ParamList } from "./types";

/**
 * UI component that loads the input image (from the route params) &
 * displays it in a cropping UI with a confirm button at the bottom.
 * Then on confirmation it navigates to the preview step with the cropped image
 * file URI as a param.
 */
const Step1Cropping: React.FC<
  StackScreenProps<ParamList, "CustomImageStep1Crop">
> = ({ navigation, route }) => {
  const cropperRef = useRef<CropView>(null);
  const [imageToCrop, setImageToCrop] = useState<ImageFileUri | null>(null);
  const [rotated, setRotated] = useState(false);

  const { t } = useTranslation();

  const { params } = route;

  const { isPictureFromGallery } = params;

  const handleError = useCallback(
    (error: Error) => {
      console.error(error);
      navigation.navigate(
        ScreenName.CustomImageErrorScreen as "CustomImageErrorScreen",
        { error },
      );
    },
    [navigation],
  );

  useEffect(() => {
    let dead = false;
    const listener: EventListenerCallback<
      StackNavigationEventMap & EventMapCore<StackNavigationState<ParamList>>,
      "beforeRemove"
    > = e => {
      if (!isPictureFromGallery) {
        navigation.dispatch(e.data.action);
        return;
      }
      e.preventDefault();
      setImageToCrop(null);
      importImageFromPhoneGallery()
        .then(importResult => {
          if (dead) return;
          if (importResult !== null) {
            setImageToCrop(importResult);
          } else {
            navigation.dispatch(e.data.action);
          }
        })
        .catch(e => {
          if (dead) return;
          handleError(e);
        });
    };
    navigation.addListener("beforeRemove", listener);
    return () => {
      dead = true;
      navigation.removeListener("beforeRemove", listener);
    };
  }, [navigation, handleError, isPictureFromGallery]);

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

  /** CROP IMAGE HANDLING */
  const handleCropResult: ImageCropperProps["onResult"] = useCallback(
    (res: CropResult) => {
      navigation.navigate(
        ScreenName.CustomImageStep2Preview as "CustomImageStep2Preview",
        res,
      );
    },
    [navigation],
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

  const [containerDimensions, setContainerDimensions] =
    useState<ImageDimensions | null>(null);
  const onContainerLayout = useCallback(({ nativeEvent: { layout } }) => {
    setContainerDimensions({ height: layout.height, width: layout.width });
  }, []);

  return (
    <SafeAreaView edges={["bottom"]} flex={1}>
      <Flex
        flex={1}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <Flex
          flex={1}
          onLayout={imageToCrop ? onContainerLayout : undefined}
          width="100%"
          justifyContent="center"
          alignItems="center"
        >
          {containerDimensions && imageToCrop ? (
            <ImageCropper
              ref={cropperRef}
              imageFileUri={imageToCrop.imageFileUri}
              aspectRatio={targetDimensions}
              style={containerDimensions} // this native component needs absolute height & width values
              onError={handleError}
              onResult={handleCropResult}
            />
          ) : (
            <InfiniteLoader />
          )}
        </Flex>
        {imageToCrop ? (
          <BottomContainer>
            <Flex mb={7} alignSelf="center">
              <Touchable onPress={handlePressRotateLeft}>
                <Flex
                  px={7}
                  py={4}
                  borderRadius={100}
                  backgroundColor="neutral.c30"
                >
                  <Icons.ReverseMedium size={24} />
                </Flex>
              </Touchable>
            </Flex>
            <Flex flexDirection="row">
              <Button
                flex={1}
                type="main"
                size="large"
                onPress={handlePressNext}
                outline={false}
              >
                {t("common.next")}
              </Button>
            </Flex>
          </BottomContainer>
        ) : null}
      </Flex>
    </SafeAreaView>
  );
};

export default Step1Cropping;
