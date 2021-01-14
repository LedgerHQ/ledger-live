/* @flow */
import React, { memo } from "react";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import SettingsRow from "../../components/SettingsRow";
import Circle from "../../components/Circle";
import Archive from "../../icons/Archive";

function ArchiveAccountRow() {
  const { colors } = useTheme();
  return (
    <SettingsRow
      event="ArchiveAccountRow"
      title={<Trans i18nKey="account.settings.archive.title" />}
      desc={<Trans i18nKey="account.settings.archive.desc" />}
      iconLeft={
        <Circle bg="rgba(153,153,153,0.1)" size={32}>
          <Archive size={16} color={colors.grey} />
        </Circle>
      }
      onPress={() => null}
    />
  );
}

export default memo(ArchiveAccountRow);
