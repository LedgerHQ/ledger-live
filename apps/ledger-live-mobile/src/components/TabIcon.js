/* @flow */
import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import LText from "./LText";

const ICON_SIZE = 24;

const IconContainer = styled.View`
  height: ${ICON_SIZE}px;
  width: ${ICON_SIZE}px;
  justify-content: center;
  align-items: center;
`;
type Props = {
  color: string,
  focused: boolean,
  i18nKey: string,
  Icon: any,
  iconSize?: number,
};

export default function TabIcon({
  Icon,
  i18nKey,
  color,
  focused,
  iconSize,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <IconContainer>
        <Icon size={iconSize || ICON_SIZE} resizeMode="contain" color={color} />
      </IconContainer>
      <LText
        numberOfLines={1}
        semiBold={!focused}
        bold={focused}
        secondary
        style={[styles.text, { color }]}
      >
        {t(i18nKey)}
      </LText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  text: {
    fontSize: 10,
    lineHeight: 12,
    textAlign: "center",
    paddingVertical: 6,
  },
});
