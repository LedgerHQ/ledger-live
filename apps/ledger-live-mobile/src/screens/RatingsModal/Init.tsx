import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import styled from "styled-components/native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { track, TrackScreen, updateIdentify } from "~/analytics";
import useRatings from "~/logic/ratings";

const NotNowButton = styled(TouchableOpacity)`
  align-items: center;
  justify-content: center;
  margin-top: 24px;
`;

type Props = {
  closeModal: () => void;
  setStep: (step: string) => void;
};

const Init = ({ closeModal, setStep }: Props) => {
  const {
    ratingsHappyMoment,
    handleRatingsSetDateOfNextAllowedRequest,
    ratingsFeatureParams,
    handleSatisfied,
    handleInitNotNow,
  } = useRatings();

  const goToEnjoy = useCallback(() => {
    setStep("enjoy");
    handleSatisfied();
    track("button_clicked", {
      flow: "review",
      page: "review_step0",
      button: "satisfied",
      source: ratingsHappyMoment?.route_name,
      params: ratingsFeatureParams,
    });
    updateIdentify();
  }, [setStep, handleSatisfied, ratingsHappyMoment?.route_name, ratingsFeatureParams]);
  const goToDisappointed = useCallback(() => {
    setStep("disappointed");
    track("button_clicked", {
      flow: "review",
      page: "review_step0",
      button: "disappointed",
      source: ratingsHappyMoment?.route_name,
      params: ratingsFeatureParams,
    });
    handleRatingsSetDateOfNextAllowedRequest(
      ratingsFeatureParams?.conditions?.disappointed_delay as Duration,
      {
        satisfaction: "disappointed",
      },
    );
    updateIdentify();
  }, [
    setStep,
    ratingsHappyMoment?.route_name,
    ratingsFeatureParams,
    handleRatingsSetDateOfNextAllowedRequest,
  ]);
  const onNotNow = useCallback(() => {
    closeModal();
    track("button_clicked", {
      flow: "review",
      page: "review_step0",
      button: "notnow",
      source: ratingsHappyMoment?.route_name,
      params: ratingsFeatureParams,
    });
    handleInitNotNow();
  }, [closeModal, ratingsHappyMoment?.route_name, ratingsFeatureParams, handleInitNotNow]);

  return (
    <Flex flex={1} alignItems="center" justifyContent="center" mt={3}>
      <TrackScreen
        category="Review"
        name="page_viewed"
        flow="review"
        page="review_step0"
        source={ratingsHappyMoment?.route_name}
        params={ratingsFeatureParams}
      />
      <Text
        variant="h4"
        fontWeight="semiBold"
        color="neutral.c100"
        textAlign="center"
        lineHeight="34.8px"
      >
        <Trans i18nKey="ratings.init.title" />
      </Text>
      <Text
        variant="body"
        fontWeight="medium"
        color="neutral.c70"
        textAlign="center"
        my={6}
        lineHeight="23.8px"
      >
        <Trans i18nKey="ratings.init.description" />
      </Text>
      <Flex alignSelf="stretch" py={6}>
        <Button onPress={goToEnjoy} outline type="shade" size="large">
          <Trans i18nKey="ratings.init.cta.enjoy" />
        </Button>
        <Button onPress={goToDisappointed} outline type="shade" mt={3} size="large">
          <Trans i18nKey="ratings.init.cta.disappointed" />
        </Button>
        <NotNowButton onPress={onNotNow}>
          <Text variant="large" fontWeight="semiBold" color="neutral.c100">
            <Trans i18nKey="ratings.init.cta.notNow" />
          </Text>
        </NotNowButton>
      </Flex>
    </Flex>
  );
};

export default Init;
