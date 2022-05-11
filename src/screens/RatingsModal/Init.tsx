import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import styled from "styled-components/native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { track, TrackScreen } from "../../analytics";
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
    track("button_clicked", {
      flow: "review",
      page: "review_step0",
      button: "satisfied",
      source: ratingsHappyMoment?.route_name,
      params: ratingsFeatureParams,
    });
  }, [ratingsHappyMoment?.route_name, setStep, ratingsFeatureParams]);
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
      ratingsFeatureParams?.conditions?.disappointed_delay,
    );
  }, [
    setStep,
    ratingsHappyMoment?.route_name,
    handleRatingsSetDateOfNextAllowedRequest,
    ratingsFeatureParams,
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
    handleRatingsSetDateOfNextAllowedRequest(
      ratingsFeatureParams?.conditions?.not_now_delay,
    );
  }, [
    closeModal,
    ratingsHappyMoment?.route_name,
    handleRatingsSetDateOfNextAllowedRequest,
    ratingsFeatureParams,
  ]);

  return (
    <Flex flex={1} alignItems="center" justifyContent="center">
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
        <Button onPress={goToEnjoy} outline type="shade" size="large">
          <Trans i18nKey="ratings.init.cta.enjoy" />
        </Button>
        <Button
          onPress={goToDisappointed}
          outline
          type="shade"
          mt={3}
          size="large"
        >
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
