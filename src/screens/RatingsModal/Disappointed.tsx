import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import NoResultsFound from "../../icons/NoResultsFound";

const NotNowButton = styled(TouchableOpacity)`
  align-items: center;
  justify-content: center;
  margin-top: 24px;
`;

type Props = {
  closeModal: any;
  setStep: any;
};

const Disappointed = ({ closeModal, setStep }: Props) => {
  const goToDisappointedForm = useCallback(() => {
    setStep("disappointedForm");
  }, [setStep]);

  return (
    <Flex flex={1} alignItems="center" justifyContent="center">
      <NoResultsFound />
      <Text
        variant="h4"
        fontWeight="semiBold"
        color="neutral.c100"
        textAlign="center"
        mt={7}
      >
        <Trans i18nKey="ratings.disappointed.title" />
      </Text>
      <Text
        variant="body"
        fontWeight="medium"
        color="neutral.c70"
        textAlign="center"
        my={6}
      >
        <Trans i18nKey="ratings.disappointed.description" />
      </Text>
      <Flex alignSelf="stretch" py={6}>
        <Button onPress={goToDisappointedForm} event="AddDevice" type="main">
          <Trans i18nKey="ratings.disappointed.cta.sendFeedback" />
        </Button>
        <NotNowButton onPress={closeModal} event="AddDevice">
          <Text variant="large" fontWeight="semiBold" color="neutral.c100">
            <Trans i18nKey="ratings.disappointed.cta.notNow" />
          </Text>
        </NotNowButton>
      </Flex>
    </Flex>
  );
};

export default Disappointed;
