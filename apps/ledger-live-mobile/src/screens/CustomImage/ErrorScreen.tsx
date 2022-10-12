import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import Button from "../../components/Button";
import CustomImageBottomModal from "../../components/CustomImage/CustomImageBottomModal";
import TranslatedError from "../../components/TranslatedError";
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
  const { error } = params;

  const { t } = useTranslation();

  const closeModal = useCallback(() => {
    setIsModalOpened(false);
  }, [setIsModalOpened]);

  const openModal = useCallback(() => {
    setIsModalOpened(true);
  }, [setIsModalOpened]);

  return (
    <Container>
      <CustomImageBottomModal isOpened={isModalOpened} onClose={closeModal} />
      <Flex flex={1} justifyContent="center" alignSelf="center" py={5}>
        <Flex flexDirection="column" alignItems="center">
          <Flex mb={7} p={6} backgroundColor="error.c100" borderRadius={100}>
            <Icons.CloseMedium color="neutral.c00" />
          </Flex>
          <Text variant="h4" fontWeight="semiBold" mb={6}>
            <TranslatedError error={error} />
          </Text>
          <Text variant="bodyLineHeight" color="neutral.c80" mb={9}>
            <TranslatedError field="description" error={error} />
          </Text>
          <Button type="main" size="large" outline={false} onPress={openModal}>
            {t("customImage.uploadAnotherImage")}
          </Button>
        </Flex>
      </Flex>
    </Container>
  );
};

export default ErrorScreen;
