import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Trans } from "react-i18next";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import NoResultsFound from "../../icons/NoResultsFound";
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

const Disappointed = ({ closeModal, setStep }: Props) => {
  const { ratingsFeatureParams, ratingsHappyMoment } = useRatings();
  const goToDisappointedForm = useCallback(() => {
    track("button_clicked", {
      flow: "review",
      page: "review_disappointedstep1",
      button: "give_feedback",
      source: ratingsHappyMoment?.route_name,
      params: ratingsFeatureParams,
    });
    setStep("disappointedForm");
  }, [ratingsFeatureParams, ratingsHappyMoment?.route_name, setStep]);
  const onNotNow = useCallback(() => {
    track("button_clicked", {
      flow: "review",
      page: "review_disappointedstep1",
      button: "notnow",
      source: ratingsHappyMoment?.route_name,
      params: ratingsFeatureParams,
    });
    closeModal();
  }, [closeModal, ratingsFeatureParams, ratingsHappyMoment?.route_name]);

  return (
    <Flex flex={1} alignItems="center" justifyContent="center" mt={3}>
      <TrackScreen
        category="Review"
        name="page_viewed"
        flow="review"
        page="review_disappointedstep1"
        source={ratingsHappyMoment?.route_name}
        params={ratingsFeatureParams}
      />
      <NoResultsFound />
      <Text
        variant="h4"
        fontWeight="semiBold"
        color="neutral.c100"
        textAlign="center"
        mt={7}
        lineHeight="34.8px"
      >
        <Trans i18nKey="ratings.disappointed.title" />
      </Text>
      <Text
        variant="body"
        fontWeight="medium"
        color="neutral.c70"
        textAlign="center"
        my={6}
        lineHeight="23.8px"
      >
        <Trans i18nKey="ratings.disappointed.description" />
      </Text>
      <Flex alignSelf="stretch" py={6}>
        <Button onPress={goToDisappointedForm} type="main" size="large">
          <Trans i18nKey="ratings.disappointed.cta.sendFeedback" />
        </Button>
        <NotNowButton onPress={onNotNow}>
          <Text variant="large" fontWeight="semiBold" color="neutral.c100">
            <Trans i18nKey="ratings.disappointed.cta.notNow" />
          </Text>
        </NotNowButton>
      </Flex>
    </Flex>
  );
};

export default Disappointed;
