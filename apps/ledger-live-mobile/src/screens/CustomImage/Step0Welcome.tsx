import React, { useCallback, useMemo, useState } from "react";
import { StackScreenProps } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import CustomImageBottomModal from "~/components/CustomImage/CustomImageBottomModal";
import BottomButtonsContainer from "~/components/CustomImage/BottomButtonsContainer";
import Button from "~/components/wrappedUi/Button";
import { ScreenName } from "~/const";
import { CustomImageNavigatorParamList } from "~/components/RootNavigator/types/CustomImageNavigator";
import { TrackScreen } from "~/analytics";
import { DeviceModelId } from "@ledgerhq/types-devices";
import Animation from "~/components/Animation";
import STAX_CLS_PREVIEW from "~/animations/device/customLockScreen/stax.json";
import FLEX_CLS_PREVIEW from "~/animations/device/customLockScreen/flex.json";
import APEX_CLS_PREVIEW from "~/animations/device/customLockScreen/apex.json";
import { useTheme } from "styled-components/native";

const analyticsScreenName = "Introduction of the customization flow";
const analyticsButtonEventProps = {
  button: "Choose a picture",
};

const Step0Welcome: React.FC<
  StackScreenProps<CustomImageNavigatorParamList, ScreenName.CustomImageStep0Welcome>
> = ({ route }) => {
  const [modalOpened, setModalOpened] = useState(false);
  const { t } = useTranslation();

  /**
   * the default values are for the case navigation to this screen is done through a deeplink without parameters
   */
  const { params: { device, deviceModelId } = { deviceModelId: null } } = route;

  const openModal = useCallback(() => {
    setModalOpened(true);
  }, [setModalOpened]);

  const closeModal = useCallback(() => {
    setModalOpened(false);
  }, [setModalOpened]);

  const animationSource = useMemo(() => {
    switch (deviceModelId) {
      case DeviceModelId.stax:
        return STAX_CLS_PREVIEW;
      case DeviceModelId.europa:
        return FLEX_CLS_PREVIEW;
      case DeviceModelId.apex:
        return APEX_CLS_PREVIEW;
      default:
        return "";
    }
  }, [deviceModelId]);

  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <TrackScreen category={analyticsScreenName} />
      <Flex flex={1} mt={8} alignItems={"center"} justifyContent={"space-between"} pb={8}>
        <Flex my={"auto"}>
          <Animation source={animationSource} style={{ width: "100%" }} />
          <Text
            variant="h4"
            fontWeight="semiBold"
            textAlign="center"
            mt={-10}
            testID="custom-image-welcome-title"
          >
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
            onPress={openModal}
            event="button_clicked"
            eventProperties={analyticsButtonEventProps}
            testID="custom-image-choose-picture-button"
            iconPosition="left"
            Icon={<Icons.DoublePicture color={colors.neutral.c00} size="S" />}
          >
            {t("customImage.landingPage.choosePicture")}
          </Button>
        </BottomButtonsContainer>
      </Flex>
      <CustomImageBottomModal
        device={device}
        isOpened={modalOpened}
        onClose={closeModal}
        deviceModelId={deviceModelId}
        referral={route?.params?.referral}
      />
    </SafeAreaView>
  );
};

export default Step0Welcome;
