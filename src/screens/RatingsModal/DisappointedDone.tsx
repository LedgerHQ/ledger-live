import React, { useCallback } from "react";
import { Linking } from "react-native";
import { Trans } from "react-i18next";
import { Flex, Text, Button, Link } from "@ledgerhq/native-ui";
import useFeature from "@ledgerhq/live-common/lib/featureFlags/useFeature";

type Props = {
  closeModal: any;
};

const DisappointedDone = ({ closeModal }: Props) => {
  const ratings = {
    enabled: true,
    happy_moments: [
      {
        route_name: "ReceiveConfirmation",
        timer: 2000,
        type: "on_leave",
      },
      {
        route_name: "ClaimRewardsValidationSuccess",
        timer: 2000,
        type: "on_enter",
      },
      {
        route_name: "SendValidationSuccess",
        timer: 2000,
        type: "on_enter",
      },
      {
        route_name: "MarketDetail",
        timer: 3000,
        type: "on_enter",
      },
    ],
    conditions: {
      minimum_accounts_number: 0,
      minimum_app_starts_number: 3,
      minimum_duration_since_app_first_start: {
        days: 0,
      },
      minimum_number_of_app_starts_since_last_crash: 2,
    },
    support_email: "support@ledger.com",
  }; // useFeature("learn"); // TODO : replace learn with ratings
  const goToMainNavigator = useCallback(() => {
    closeModal();
  }, [closeModal]);

  const onEmailClick = useCallback(() => {
    Linking.openURL(`mailto:${ratings?.support_email}`);
  }, [ratings?.support_email]);

  return (
    <Flex flex={1} alignItems="center" justifyContent="center">
      <Text
        variant="h4"
        fontWeight="semiBold"
        color="neutral.c100"
        textAlign="center"
      >
        <Trans i18nKey="ratings.disappointedDone.title" />
      </Text>
      <Text
        variant="body"
        fontWeight="medium"
        color="neutral.c70"
        textAlign="center"
        mt={6}
      >
        <Trans i18nKey="ratings.disappointedDone.description" />
      </Text>
      <Link type="main" event="TronManageVotes" onPress={onEmailClick} mb={6}>
        {ratings?.support_email}
      </Link>
      <Flex alignSelf="stretch" py={6}>
        <Button onPress={goToMainNavigator} event="AddDevice" type="shade">
          <Trans i18nKey="ratings.disappointedDone.cta.done" />
        </Button>
      </Flex>
    </Flex>
  );
};

export default DisappointedDone;
