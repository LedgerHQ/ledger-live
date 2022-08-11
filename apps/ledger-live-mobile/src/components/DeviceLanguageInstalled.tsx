import React, { useEffect } from "react";

import { Language } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { BoxedIcon, Flex, Text, Button, Icons } from "@ledgerhq/native-ui";

const DeviceLanguageInstalled: React.FC<{
  onContinue?: () => void;
  onMount?: () => void;
  installedLanguage: Language;
}> = ({ onContinue, onMount, installedLanguage }) => {
  useEffect(() => {
    if (onMount) {
      onMount();
    }
  }, [onMount]);
  const { t } = useTranslation();

  return (
    <Flex alignItems="center">
      <BoxedIcon
        Icon={Icons.CheckAloneMedium}
        iconColor="success.c100"
        size={48}
        iconSize={24}
      />
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
