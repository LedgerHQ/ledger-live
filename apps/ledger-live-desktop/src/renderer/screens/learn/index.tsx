import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/react-ui";
import useTheme from "~/renderer/hooks/useTheme";
<<<<<<< HEAD
<<<<<<< HEAD
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
=======
import { useFeature } from "@ledgerhq/live-config/FeatureFlags/index";
>>>>>>> f8e0133b13 (fix: refactoring)
=======
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
>>>>>>> 5795ae130c (fix: snackcase for folder name)

const DEFAULT_LEARN_URL = "https://www.ledger.com/ledger-live-learn";

export default function LearnScreen() {
  const { t, i18n } = useTranslation();
  const learn = useFeature("learn");
  const learnURL = learn?.params?.desktop?.url ? learn.params.desktop.url : DEFAULT_LEARN_URL;
  const themeType: string = useTheme().colors.palette.type;

  const uri = `${learnURL}?theme=${themeType}&lang=${i18n.languages[0]}`;

  return (
    <Flex
      flexDirection="column"
      flex={1}
      alignItems="stretch"
      justifyContent="flex-start"
      px={1}
      mx={-1}
    >
      <Text variant="h3" fontSize="28px" lineHeight="33px">
        {t("learn.title")}
      </Text>
      <Flex flexGrow={1}>
        <iframe
          loading="eager"
          sandbox="allow-scripts"
          frameBorder="0"
          allowFullScreen={false}
          width="100%"
          height="100%"
          src={uri}
        />
      </Flex>
    </Flex>
  );
}
