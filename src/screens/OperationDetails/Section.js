// @flow

import React from "react";
import { StyleSheet, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import LText from "../../components/LText";

type Props = FieldWrapperProps & {
  title: string,
  value?: string,
  headerRight?: React$Node,
};

export default function Section({
  title,
  value,
  children = (
    <LText style={styles.value} semiBold selectable>
      {value}
    </LText>
  ),
  headerRight,
  onPress,
  style,
}: Props) {
  return (
    <SectionWrapper onPress={onPress} style={style}>
      <View style={styles.titleWrapper}>
        <LText style={styles.title} color="grey">
          {title}
        </LText>
        {headerRight}
      </View>

      {children}
    </SectionWrapper>
  );
}

type FieldWrapperProps = {
  onPress?: () => void,
  children?: any,
  style?: any,
};

function SectionWrapper({ onPress, children, style }: FieldWrapperProps) {
  if (!onPress) {
    return <View style={[styles.wrapper, style]}>{children}</View>;
  }

  return (
    <RectButton style={styles.wrapper} onPress={onPress}>
      {children}
    </RectButton>
  );
}

export const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
  },
  titleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 14,

    marginRight: 8,
  },
  value: {},
});
