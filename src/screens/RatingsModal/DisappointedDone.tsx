import React, { useCallback } from "react";
import { Linking } from "react-native";
import { Trans } from "react-i18next";
import { Flex, Text, Button, Link } from "@ledgerhq/native-ui";
import useFeature from "@ledgerhq/live-common/lib/featureFlags/useFeature";

type Props = {
  closeModal: any;
};

const DisappointedDone = ({ closeModal }: Props) => {
  const ratings = useFeature("ratings");
  const goToMainNavigator = useCallback(() => {
    closeModal();
  }, [closeModal]);

  const onEmailClick = useCallback(() => {
    Linking.openURL(`mailto:${ratings?.params?.support_email}`);
  }, [ratings?.params?.support_email]);

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
        {ratings?.params?.support_email}
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
