import React, { useCallback } from "react";
import { Linking } from "react-native";
import { Trans } from "react-i18next";
import { Flex, Text, Button, Link } from "@ledgerhq/native-ui";
import useRatings from "~/logic/ratings";
import { track, TrackScreen } from "~/analytics";

type Props = {
  closeModal: () => void;
};

const DisappointedDone = ({ closeModal }: Props) => {
  const { ratingsFeatureParams, ratingsHappyMoment } = useRatings();
  const goToMainNavigator = useCallback(() => {
    closeModal();
  }, [closeModal]);

  const onEmailClick = useCallback(() => {
    Linking.openURL(`mailto:${ratingsFeatureParams?.support_email}`);
    track("button_clicked", {
      flow: "review",
      page: "review_disappointedstep2",
      button: "mailto",
      source: ratingsHappyMoment?.route_name,
      params: ratingsFeatureParams,
    });
  }, [ratingsFeatureParams, ratingsHappyMoment?.route_name]);

  return (
    <Flex flex={1} alignItems="center" justifyContent="center" mt={3}>
      <TrackScreen
        category="Review"
        name="page_viewed"
        flow="review"
        page="review_disappointedstep3"
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
        <Trans i18nKey="ratings.disappointedDone.title" />
      </Text>
      <Text
        variant="body"
        fontWeight="medium"
        color="neutral.c70"
        textAlign="center"
        mt={6}
        lineHeight="23.8px"
      >
        <Trans i18nKey="ratings.disappointedDone.description" />
      </Text>
      <Flex mb={6}>
        <Link type="main" onPress={onEmailClick}>
          {ratingsFeatureParams?.support_email}
        </Link>
      </Flex>
      <Flex alignSelf="stretch" py={6}>
        <Button onPress={goToMainNavigator} type="shade" size="large">
          <Trans i18nKey="ratings.disappointedDone.cta.done" />
        </Button>
      </Flex>
    </Flex>
  );
};

export default DisappointedDone;
