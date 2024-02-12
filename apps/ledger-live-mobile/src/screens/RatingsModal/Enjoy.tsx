import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { Linking, Platform, TouchableOpacity } from "react-native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { urls } from "~/utils/urls";
import { track, TrackScreen } from "~/analytics";
import useRatings from "~/logic/ratings";
import Love from "~/icons/Love";

const NotNowButton = styled(TouchableOpacity)`
  align-items: center;
  justify-content: center;
  margin-top: 24px;
`;

type Props = {
  closeModal: () => void;
};

const Enjoy = ({ closeModal }: Props) => {
  const { ratingsFeatureParams, ratingsHappyMoment, handleEnjoyNotNow, handleGoToStore } =
    useRatings();
  const goToStore = useCallback(() => {
    track("RedirectedToStore", { source: ratingsHappyMoment?.route_name });
    track("button_clicked", {
      flow: "review",
      page: "review_satisfiedstep1",
      button: "rate_store",
      source: ratingsHappyMoment?.route_name,
      params: ratingsFeatureParams,
    });
    Linking.openURL(Platform.OS === "ios" ? urls.applestoreRate : urls.playstore);
    closeModal();
    handleGoToStore();
  }, [ratingsHappyMoment?.route_name, ratingsFeatureParams, closeModal, handleGoToStore]);
  const onNotNow = useCallback(() => {
    track("button_clicked", {
      flow: "review",
      page: "review_satisfiedstep1",
      button: "notnow",
      source: ratingsHappyMoment?.route_name,
      params: ratingsFeatureParams,
    });
    closeModal();
    handleEnjoyNotNow();
  }, [ratingsHappyMoment?.route_name, ratingsFeatureParams, closeModal, handleEnjoyNotNow]);

  return (
    <Flex flex={1} alignItems="center" justifyContent="center" mt={3}>
      <TrackScreen
        category="Review"
        name="page_viewed"
        flow="review"
        page="review_satisfiedstep1"
        source={ratingsHappyMoment?.route_name}
        params={ratingsFeatureParams}
      />
      <Love />
      <Text
        variant="h4"
        fontWeight="semiBold"
        color="neutral.c100"
        textAlign="center"
        lineHeight="34.8px"
        mt={7}
      >
        <Trans i18nKey="ratings.enjoy.title" />
      </Text>
      <Text
        variant="body"
        fontWeight="medium"
        color="neutral.c70"
        textAlign="center"
        my={6}
        lineHeight="23.8px"
      >
        <Trans i18nKey="ratings.enjoy.description" />
      </Text>
      <Flex alignSelf="stretch" py={6}>
        <Button onPress={goToStore} type="main" size="large">
          <Trans i18nKey="ratings.enjoy.cta.rate" />
        </Button>
        <NotNowButton onPress={onNotNow}>
          <Text variant="large" fontWeight="semiBold" color="neutral.c100">
            <Trans i18nKey="ratings.enjoy.cta.notNow" />
          </Text>
        </NotNowButton>
      </Flex>
    </Flex>
  );
};

export default Enjoy;
