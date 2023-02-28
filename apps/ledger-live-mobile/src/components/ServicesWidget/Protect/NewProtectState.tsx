import { Tag, Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { GestureResponderEvent, Linking } from "react-native";
import Button from "../../Button";

function NewProtectState({ params }: { params: Record<string, string> }) {
  const { t } = useTranslation();
  const { learnMoreURI, alreadySubscribedURI } = params || {};

  const onLearnMore = useCallback(() => {
    Linking.canOpenURL(learnMoreURI).then(() => Linking.openURL(learnMoreURI));
  }, [learnMoreURI]);

  const onAlreadySubscribe = useCallback(() => {
    Linking.canOpenURL(learnMoreURI).then(() =>
      Linking.openURL(alreadySubscribedURI),
    );
  }, [learnMoreURI, alreadySubscribedURI]);

  const onPressInAlreadySubscribed = useCallback((e: GestureResponderEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <>
      <Button type="main" outline={false} onPress={onLearnMore} mb={6}>
        {t(`servicesWidget.protect.status.new.actions.learnMore`)}
      </Button>
      <Text variant="body" color="neutral.c100" mb={6}>
        <Trans
          i18nKey="servicesWidget.protect.status.new.actions.alreadySubscribed"
          components={{
            LinkAccount: (
              <Text
                variant="body"
                color="neutral.c100"
                onPressIn={onPressInAlreadySubscribed}
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
    >
      {t(`servicesWidget.protect.status.new.title`)}
    </Tag>
  );
};

NewProtectState.StatusTag = StateTag;

export default NewProtectState;
