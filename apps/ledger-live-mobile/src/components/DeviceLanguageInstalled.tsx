import React, { useEffect } from "react";

import { Language, languageIds } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { Flex, Text, Button, Icons } from "@ledgerhq/native-ui";
import { useDispatch } from "react-redux";
import { setLastSeenDeviceLanguageId } from "../actions/settings";

const DeviceLanguageInstalled: React.FC<{
  onContinue?: () => void;
  onMount?: () => void;
  installedLanguage: Language;
}> = ({ onContinue, onMount, installedLanguage }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Nb Update the stored information for the last seen device to match this new language.
    dispatch(setLastSeenDeviceLanguageId(languageIds[installedLanguage]));

    if (onMount) {
      onMount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { t } = useTranslation();

  return (
    <Flex alignItems="center">
      <Flex backgroundColor="neutral.c30" p={4} borderRadius="9999px">
        <Icons.CircledCheckSolidMedium color="success.c100" size={32} />
      </Flex>
      <Text variant="h4" textAlign="center" my={7} fontWeight="semiBold">
        {t("deviceLocalization.languageInstalled", {
          language: t(`deviceLocalization.languages.${installedLanguage}`),
        })}
      </Text>
      <Button type="main" alignSelf="stretch" onPress={onContinue}>
        {t("common.continue")}
      </Button>
    </Flex>
  );
};

export default DeviceLanguageInstalled;
