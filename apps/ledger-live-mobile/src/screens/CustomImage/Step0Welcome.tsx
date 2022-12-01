import React, { useCallback, useState } from "react";
import { StackScreenProps } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import CustomImageBottomModal from "../../components/CustomImage/CustomImageBottomModal";
import BottomButtonsContainer from "../../components/CustomImage/BottomButtonsContainer";
import { ScreenName } from "../../const";
import { CustomImageNavigatorParamList } from "../../components/RootNavigator/types/CustomImageNavigator";

const Step0Welcome: React.FC<
  StackScreenProps<
    CustomImageNavigatorParamList,
    ScreenName.CustomImageStep0Welcome
  >
> = ({ route }) => {
  const [modalOpened, setModalOpened] = useState(false);
  const { t } = useTranslation();

  const { params } = route;

  const { device } = params || {};

  const openModal = useCallback(() => {
    setModalOpened(true);
  }, [setModalOpened]);

  const closeModal = useCallback(() => {
    setModalOpened(false);
  }, [setModalOpened]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Flex flex={1}>
        <Flex
          backgroundColor="neutral.c40"
          alignItems="center"
          justifyContent="center"
          height={250}
          width="100%"
        >
          <Text>illustration placeholder</Text>
        </Flex>
        <Flex flex={1} px={7}>
          <Text variant="h4" fontWeight="semiBold" mt={7} textAlign="center">
            {t("customImage.landingPage.title")}
          </Text>
          <Text
            variant="bodyLineHeight"
            color="neutral.c70"
            textAlign="center"
            mt={6}
          >
            {t("customImage.landingPage.subtitle")}
          </Text>
        </Flex>
        <BottomButtonsContainer>
          <Button size="large" type="main" onPress={openModal}>
            {t("customImage.landingPage.choosePicture")}
          </Button>
        </BottomButtonsContainer>
      </Flex>
      <CustomImageBottomModal
        device={device}
        isOpened={modalOpened}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
};

export default Step0Welcome;
