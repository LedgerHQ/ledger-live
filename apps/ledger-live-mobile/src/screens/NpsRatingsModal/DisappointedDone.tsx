import React, { useCallback } from "react";
import { Linking } from "react-native";
import { Trans } from "react-i18next";
import { Flex, Text, Button, Link } from "@ledgerhq/native-ui";
import useNpsRatings from "~/logic/npsRatings";
import { track, TrackScreen } from "~/analytics";

type Props = {
  closeModal: () => void;
};

const DisappointedDone = ({ closeModal }: Props) => {
  const { ratingsFeatureParams, ratingsHappyMoment } = useNpsRatings();
  const goToMainNavigator = useCallback(() => {
    track("button_clicked", {
      flow: "NPS",
      page: "NPS Step 3 Thank you for feedback",
      button: "Done",
    });
    closeModal();
  }, [closeModal]);

  const onEmailClick = useCallback(() => {
    Linking.openURL(`mailto:${ratingsFeatureParams?.support_email}`);
    track("button_clicked", {
      flow: "NPS",
      page: "NPS Step 3 Thank you for feedback",
      button: "mailto",
    });
  }, [ratingsFeatureParams]);

  return (
    <Flex flex={1} alignItems="center" justifyContent="center" mt={3}>
      <TrackScreen
        flow="NPS"
        name="NPS Step 3 Thank you for feedback"
        page="NPS Step 3 Thank you for feedback"
        source={ratingsHappyMoment?.route_name}
        params={ratingsFeatureParams}
        category="NPS"
      />
      <Text variant="h4" fontWeight="semiBold" color="neutral.c100" textAlign="center">
        <Trans i18nKey="ratings.disappointedDone.title" />
      </Text>
      <Text variant="body" fontWeight="medium" color="neutral.c70" textAlign="center" mt={6}>
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
