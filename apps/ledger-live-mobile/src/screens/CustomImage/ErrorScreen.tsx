import { Flex } from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import Button from "../../components/Button";
import CustomImageBottomModal from "../../components/CustomImage/CustomImageBottomModal";
import GenericErrorView from "../../components/GenericErrorView";
import { ParamList } from "./types";

const Container = styled(SafeAreaView).attrs({
  edges: ["left", "right", "bottom"],
})`
  flex: 1;
`;

const ErrorScreen: React.FC<
  StackScreenProps<ParamList, "CustomImageErrorScreen">
> = ({ route }) => {
  const [isModalOpened, setIsModalOpened] = useState(false);
  const { params } = route;
  const { error, device } = params;

  const { t } = useTranslation();

  const closeModal = useCallback(() => {
    setIsModalOpened(false);
  }, [setIsModalOpened]);

  const openModal = useCallback(() => {
    setIsModalOpened(true);
  }, [setIsModalOpened]);

  return (
    <Container>
      <CustomImageBottomModal
        isOpened={isModalOpened}
        onClose={closeModal}
        device={device}
      />
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
        >
          {t("customImage.uploadAnotherImage")}
        </Button>
      </Flex>
    </Container>
  );
};

export default ErrorScreen;
