import React, { useEffect } from "react";

import { Language, languageIds } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { Flex, Button, Icons } from "@ledgerhq/native-ui";
import { useDispatch } from "react-redux";
import { setLastSeenDeviceLanguageId } from "~/actions/settings";
import { GenericInformationBody } from "./GenericInformationBody";

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
    <Flex pt={10} alignItems={"center"}>
      <GenericInformationBody
        Icon={Icons.CheckmarkCircleFill}
        iconColor="success.c60"
        title={t("deviceLocalization.languageInstalled", {
          language: t(`deviceLocalization.languages.${installedLanguage}`),
        })}
        description={t("deviceLocalization.languageInstalledDesc")}
      />
      <Button mt={8} size="large" type="main" alignSelf="stretch" onPress={onContinue}>
        {t("common.continue")}
      </Button>
    </Flex>
  );
};

export default DeviceLanguageInstalled;
