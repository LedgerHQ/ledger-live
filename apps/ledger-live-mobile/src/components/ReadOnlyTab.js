/* @flow */
import React from "react";
import { useSelector } from "react-redux";
import { readOnlyModeEnabledSelector } from "../reducers/settings";
import TabIcon from "./TabIcon";

type Props = {
  oni18nKey: string,
  OnIcon: React$ComponentType<*>,
  offi18nKey: string,
  OffIcon: React$ComponentType<*>,
  tintColor: string,
  focused: boolean,
  readOnlyModeEnabled: boolean,
  color: string,
};

export default function ReadOnlyTab({
  OnIcon,
  focused,
  tintColor,
  OffIcon,
  oni18nKey,
  offi18nKey,
  ...extraProps
}: Props) {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const icon = readOnlyModeEnabled ? OnIcon : OffIcon;
  const i18nKey = readOnlyModeEnabled ? oni18nKey : offi18nKey;

  return (
    <TabIcon
      {...extraProps}
      focused={focused}
      tintColor={tintColor}
      Icon={icon}
      i18nKey={i18nKey}
    />
  );
}
