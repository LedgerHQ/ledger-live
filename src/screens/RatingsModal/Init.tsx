import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import styled from "styled-components/native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { track } from "../../analytics";
import useRatings from "../../logic/ratings";

const NotNowButton = styled(TouchableOpacity)`
  align-items: center;
  justify-content: center;
  margin-top: 24px;
`;

type Props = {
  closeModal: Function;
  setStep: Function;
};

const Init = ({ closeModal, setStep }: Props) => {
  const {
    ratingsHappyMoment,
    handleRatingsSetDateOfNextAllowedRequest,
    ratingsFeatureParams,
  } = useRatings();
  const goToEnjoy = useCallback(() => {
    setStep("enjoy");
    track("Satisfied", { source: ratingsHappyMoment.route_name });
  }, [ratingsHappyMoment.route_name, setStep]);
  const goToDisappointed = useCallback(() => {
    setStep("disappointed");
    track("Disappointed", { source: ratingsHappyMoment.route_name });
    handleRatingsSetDateOfNextAllowedRequest(
      ratingsFeatureParams?.conditions?.disappointed_delay,
    );
  }, [
    setStep,
    ratingsHappyMoment.route_name,
    handleRatingsSetDateOfNextAllowedRequest,
    ratingsFeatureParams?.conditions?.disappointed_delay,
  ]);
  const onNotNow = useCallback(() => {
    closeModal();
    track("NotNow", { source: ratingsHappyMoment.route_name });
    handleRatingsSetDateOfNextAllowedRequest(
      ratingsFeatureParams?.conditions?.not_now_delay,
    );
  }, [
    closeModal,
    ratingsHappyMoment.route_name,
    handleRatingsSetDateOfNextAllowedRequest,
    ratingsFeatureParams?.conditions?.not_now_delay,
  ]);

  return (
    <Flex flex={1} alignItems="center" justifyContent="center">
      <Text
        variant="h4"
        fontWeight="semiBold"
        color="neutral.c100"
        textAlign="center"
      >
        <Trans i18nKey="ratings.init.title" />
      </Text>
      <Text
        variant="body"
        fontWeight="medium"
        color="neutral.c70"
        textAlign="center"
        my={6}
      >
        <Trans i18nKey="ratings.init.description" />
      </Text>
      <Flex alignSelf="stretch" py={6}>
        <Button onPress={goToEnjoy} outline event="AddDevice" type="shade">
          <Trans i18nKey="ratings.init.cta.enjoy" />
        </Button>
        <Button
          onPress={goToDisappointed}
          outline
          event="AddDevice"
          type="shade"
          mt={3}
        >
          <Trans i18nKey="ratings.init.cta.disappointed" />
        </Button>
        <NotNowButton onPress={onNotNow} event="AddDevice">
          <Text variant="large" fontWeight="semiBold" color="neutral.c100">
            <Trans i18nKey="ratings.init.cta.notNow" />
          </Text>
        </NotNowButton>
      </Flex>
    </Flex>
  );
};

export default Init;
