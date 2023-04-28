import React from "react";
import { BoxedIcon, Flex, Icons, Text, Button } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

type Props = {
  onStart: () => Event;
};

const StartScreen = ({ onStart }: Props) => {
  const { t } = useTranslation();
  return (
    <Flex
      height="100%"
      width="100%"
      alignItems="center"
      justifyContent="center"
      backgroundColor="primary.c60"
    >
      <Flex flexDirection="column" alignItems="center" width={338} height={255} rowGap={7}>
        <BoxedIcon
          Icon={Icons.TrophyMedium}
          iconSize={28}
          size={64}
          borderColor="neutral.c100"
          iconColor="neutral.c100"
        />
        <Text variant="h1">{t("onboarding.quizz.title")}</Text>
        <Text variant="body" fontWeight="medium">
          {t("onboarding.quizz.descr")}
        </Text>
        <Button
          data-test-id="v3-quiz-start-button"
          variant="main"
          Icon={Icons.TrophyMedium}
          iconPosition="left"
          onClick={onStart}
        >
          {t("onboarding.quizz.buttons.start")}
        </Button>
      </Flex>
    </Flex>
  );
};

export default StartScreen;
