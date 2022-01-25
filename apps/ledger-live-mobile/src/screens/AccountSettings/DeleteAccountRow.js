/* @flow */
import React, { memo } from "react";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import SettingsRow from "../../components/SettingsRow";
import Circle from "../../components/Circle";
import Trash from "../../icons/Trash";

type Props = {
  onPress: () => void,
};

function DeleteAccountRow({ onPress }: Props) {
  const { colors } = useTheme();
  return (
    <SettingsRow
      event="DeleteAccountRow"
      title={<Trans i18nKey="account.settings.delete.title" />}
      desc={<Trans i18nKey="account.settings.delete.desc" />}
      iconLeft={
        <Circle bg="rgba(234,46,73,0.1)" size={32}>
          <Trash size={16} color={colors.alert} />
        </Circle>
      }
      onPress={onPress}
      titleStyle={{ color: colors.alert }}
    />
  );
}

export default memo<Props>(DeleteAccountRow);
