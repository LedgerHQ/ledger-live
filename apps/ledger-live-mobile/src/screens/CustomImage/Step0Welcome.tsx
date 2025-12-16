import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/core";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flex, Icons, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import BottomButtonsContainer from "~/components/CustomImage/BottomButtonsContainer";
import Button from "~/components/wrappedUi/Button";
import { NavigatorName, ScreenName } from "~/const";
import { CustomImageNavigatorParamList } from "~/components/RootNavigator/types/CustomImageNavigator";
import { TrackScreen } from "~/analytics";
import { DeviceModelId } from "@ledgerhq/types-devices";
import Animation from "~/components/Animation";
import { useLottieAsset } from "~/utils/lottieAsset";

const staxClsAsset = require("~/animations/device/customLockScreen/stax.lottie.json");
const flexClsAsset = require("~/animations/device/customLockScreen/flex.lottie.json");
const apexClsAsset = require("~/animations/device/customLockScreen/apex.lottie.json");
import { useTheme } from "styled-components/native";
import { importImageFromPhoneGallery } from "~/components/CustomImage/imageUtils";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";

const analyticsScreenName = "Introduction of the customization flow";
const analyticsButtonEventProps = {
  button: "Choose a picture",
};

const Step0Welcome: React.FC<
  NativeStackScreenProps<CustomImageNavigatorParamList, ScreenName.CustomImageStep0Welcome>
> = ({ route }) => {
  const { t } = useTranslation();

  /**
   * the default values are for the case navigation to this screen is done through a deeplink without parameters
   */
  const { params: { device, deviceModelId } = { deviceModelId: null } } = route;

  const [waitingForUserPicture, setWaitingForUserPicture] = useState(false);
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();

  useEffect(() => {
    let dead = false;
    if (waitingForUserPicture) {
      importImageFromPhoneGallery().then(res => {
        if (dead) return;
        if (res !== null) {
          navigation.navigate(NavigatorName.CustomImage, {
            screen: ScreenName.CustomImagePreviewPreEdit,
            params: {
              ...res,
              device,
              deviceModelId,
              referral: route?.params?.referral,
            },
          });
        }
        setWaitingForUserPicture(false);
      });
    }
    return () => {
      dead = true;
    };
  }, [waitingForUserPicture, device, deviceModelId, navigation, route?.params?.referral]);

  const handlePressChoosePicture = useCallback(async () => {
    setWaitingForUserPicture(true);
  }, [setWaitingForUserPicture]);

  const staxClsPreview = useLottieAsset(staxClsAsset);
  const flexClsPreview = useLottieAsset(flexClsAsset);
  const apexClsPreview = useLottieAsset(apexClsAsset);

  const animationSource = useMemo(() => {
    switch (deviceModelId) {
      case DeviceModelId.stax:
        return staxClsPreview;
      case DeviceModelId.europa:
        return flexClsPreview;
      case DeviceModelId.apex:
        return apexClsPreview;
      default:
        return "";
    }
  }, [deviceModelId, staxClsPreview, flexClsPreview, apexClsPreview]);

  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <TrackScreen category={analyticsScreenName} />
      <Flex flex={1} mt={8} alignItems={"center"} justifyContent={"space-between"} pb={8}>
        <Flex my={"auto"} testID="custom-image-welcome-title">
          <Animation source={animationSource} style={{ width: "100%" }} />
          <Text variant="h4" fontWeight="semiBold" textAlign="center" mt={-10}>
            {t("customImage.landingPage.title", {
              productName: getDeviceModel(deviceModelId ?? DeviceModelId.stax).productName,
            })}
          </Text>
        </Flex>
        <BottomButtonsContainer>
          <Button
            alignSelf="stretch"
            size="large"
            type="main"
            outline={false}
            onPress={handlePressChoosePicture}
            event="button_clicked"
            disabled={waitingForUserPicture}
            eventProperties={analyticsButtonEventProps}
            testID="custom-image-choose-picture-button"
            iconPosition="left"
            Icon={() =>
              waitingForUserPicture ? (
                <InfiniteLoader size={24} />
              ) : (
                <Icons.DoublePicture color={colors.neutral.c00} size="M" />
              )
            }
          >
            {t("customImage.landingPage.choosePicture")}
          </Button>
        </BottomButtonsContainer>
      </Flex>
    </SafeAreaView>
  );
};

export default Step0Welcome;
