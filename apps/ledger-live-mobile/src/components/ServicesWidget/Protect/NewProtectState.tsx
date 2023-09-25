import { Button, Tag, Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { GestureResponderEvent, Linking } from "react-native";

function NewProtectState({ params }: { params: Record<string, string> }) {
  const { t } = useTranslation();
  const { learnMoreURI, alreadySubscribedURI } = params || {};

  const onLearnMore = useCallback(() => {
    Linking.canOpenURL(learnMoreURI).then(() => Linking.openURL(learnMoreURI));
  }, [learnMoreURI]);

  const onAlreadySubscribe = useCallback(() => {
    Linking.canOpenURL(alreadySubscribedURI).then(() => Linking.openURL(alreadySubscribedURI));
  }, [alreadySubscribedURI]);

  const onPressInLearnMore = useCallback((e: GestureResponderEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <>
      <Button
        type="main"
        outline={false}
        size={"small"}
        onPressIn={onPressInLearnMore}
        onPress={onLearnMore}
        mb={6}
      >
        {t(`servicesWidget.protect.status.new.actions.learnMore`)}
      </Button>
      <Text variant="paragraph" fontWeight={"semiBold"} color="neutral.c100" textAlign={"center"}>
        <Trans
          i18nKey="servicesWidget.protect.status.new.actions.alreadySubscribed"
          components={{
            LinkAccount: (
              <Text
                variant="paragraph"
                fontWeight="semiBold"
                color="neutral.c100"
                onPress={onAlreadySubscribe}
                style={{ textDecorationLine: "underline" }}
              >
                {""}
              </Text>
            ),
          }}
        />
      </Text>
    </>
  );
}

const StateTag = () => {
  const { t } = useTranslation();

  return (
    <Tag
      color="neutral.c40"
      textColor="neutral.c90"
      ellipsizeMode="tail"
      size="medium"
      uppercase={false}
    >
      {t(`servicesWidget.protect.status.new.title`)}
    </Tag>
  );
};

NewProtectState.StatusTag = StateTag;

export default NewProtectState;
