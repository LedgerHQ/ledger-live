import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import SettingsRow from "~/components/SettingsRow";

type Props = {
  onPress: () => void;
};

function DeleteAccountRow({ onPress }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SettingsRow
      event="DeleteAccountRow"
      title={t("account.settings.delete.title")}
      titleStyle={{ color: colors.error.c50 }}
      desc={t("account.settings.delete.desc")}
      onPress={onPress}
      arrowRight
    />
  );
}

export default memo<Props>(DeleteAccountRow);
