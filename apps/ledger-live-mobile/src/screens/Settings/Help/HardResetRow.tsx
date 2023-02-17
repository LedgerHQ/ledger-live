import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { InfoMedium } from "@ledgerhq/native-ui/assets/icons";
import SettingsRow from "../../../components/SettingsRow";
import QueuedDrawer from "../../../components/QueuedDrawer";

export default function HardResetRow() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [isModalOpened, setIsModalOpened] = useState(false);

  const onRequestClose = useCallback(() => {
    setIsModalOpened(false);
  }, []);

  const onPress = useCallback(() => {
    setIsModalOpened(true);
  }, []);

  return (
    <>
      <SettingsRow
        event="HardResetRow"
        title={t("settings.help.hardReset")}
        titleStyle={{ color: colors.error.c100 }}
        desc={t("settings.help.hardResetDesc")}
        onPress={onPress}
        arrowRight
      />
      <QueuedDrawer
        isRequestingToBeOpened={isModalOpened}
        onClose={onRequestClose}
        Icon={InfoMedium}
        iconColor={"error.c100"}
        title={t("reset.title")}
        description={t("reset.description")}
      />
    </>
  );
}
