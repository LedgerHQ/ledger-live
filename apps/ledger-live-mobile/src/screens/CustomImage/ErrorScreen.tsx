import { Flex } from "@ledgerhq/native-ui";
import React, { useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { TrackScreen } from "~/analytics";
import Button from "~/components/Button";
import CustomImageBottomModal from "~/components/CustomImage/CustomImageBottomModal";
import GenericErrorView from "~/components/GenericErrorView";
import { CustomImageNavigatorParamList } from "~/components/RootNavigator/types/CustomImageNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";

const Container = styled(SafeAreaView).attrs({
  edges: ["left", "right", "bottom"],
})`
  flex: 1;
`;

type NavigationProps = BaseComposite<
  StackNavigatorProps<CustomImageNavigatorParamList, ScreenName.CustomImageErrorScreen>
>;

const buttonClickedEventProperties = {
  button: "upload another image",
};

const ErrorScreen = ({ route, navigation }: NavigationProps) => {
  const [isModalOpened, setIsModalOpened] = useState(false);
  const { params } = route;
  const { error, device } = params;

  // Only keep 1 instance of error page in the navigation
  useEffect(() => {
    const navigationState = navigation.getState();
    const { index, routes } = navigationState;
    const firstErrorPageIndex = routes.findIndex(
      (route: { name: string }, id: number) =>
        route.name === ScreenName.CustomImageErrorScreen && index !== id,
    );

    if (firstErrorPageIndex !== -1) {
      const filteredRoutes = routes.filter((route, id) => id !== firstErrorPageIndex);

      navigation.reset({
        ...navigationState,
        index: filteredRoutes.length - 1,
        routes: filteredRoutes,
      });
    }
  }, [navigation]);

  const { t } = useTranslation();

  const closeModal = useCallback(() => {
    setIsModalOpened(false);
  }, [setIsModalOpened]);

  const openModal = useCallback(() => {
    setIsModalOpened(true);
  }, [setIsModalOpened]);

  const screenName = "Error: " + error.name;

  return (
    <Container>
      <TrackScreen category={screenName} />
      <CustomImageBottomModal isOpened={isModalOpened} onClose={closeModal} device={device} />
      <Flex flex={1} justifyContent="center" alignSelf="center" p={5}>
        <Flex flex={1} justifyContent="center">
          <GenericErrorView error={error} hasExportLogButton={false} />
        </Flex>
        <Button
          mb={5}
          type="main"
          size="large"
          outline={false}
          onPress={openModal}
          event="button_clicked"
          eventProperties={buttonClickedEventProperties}
        >
          {t("customImage.uploadAnotherImage")}
        </Button>
      </Flex>
    </Container>
  );
};

export default ErrorScreen;
