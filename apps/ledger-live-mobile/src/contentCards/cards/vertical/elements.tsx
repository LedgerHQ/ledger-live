import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import React from "react";
import { Image as NativeImage, Pressable, StyleProp, View, ViewStyle } from "react-native";
import { useTheme } from "styled-components/native";
import { ButtonAction } from "~/contentCards/cards/types";
import { Size } from "~/contentCards/cards/vertical/types";

export const Image = (props: { uri: string }) => (
  <NativeImage source={props} style={{ resizeMode: "contain", flex: 1, aspectRatio: 1 }} />
);

const absoluteTopStyle: StyleProp<ViewStyle> = { position: "absolute", padding: 12, zIndex: 1 };

export const Close = ({ onPress }: { onPress: ButtonAction }) => {
  return (
    <View style={{ right: 0, ...absoluteTopStyle }}>
      <Pressable onPress={onPress} hitSlop={11}>
        <Icons.Close size="XS" />
      </Pressable>
    </View>
  );
};

type LabelProps = {
  label: string;
  size: Size;
};

export const Tag = ({ label }: LabelProps) => {
  const { colors } = useTheme();

  return (
    <View style={{ left: 0, ...absoluteTopStyle }}>
      <Flex bg={colors.primary.c80} borderRadius={"4px"} height={"18px"} justifyContent="center">
        <Text variant="small" fontWeight="bold" px={"6px"} color={colors.neutral.c00}>
          {label}
        </Text>
      </Flex>
    </View>
  );
};

export const TitleSizes: {
  [key in Size]: object;
} = {
  L: {
    variant: "large",
    fontWeight: "medium",
    numberOfLine: 1,
    paddingTop: 8,
  },
  M: {
    variant: "body",
    fontWeight: "medium",
    numberOfLine: 1,
    paddingTop: 6,
  },
  S: {
    variant: "body",
    fontWeight: "medium",
    numberOfLine: 1,
    paddingTop: 3,
  },
};

export const Title = ({ label, size }: LabelProps) => {
  return <Text {...TitleSizes[size]}>{label}</Text>;
};

export const SubtitleSizes: {
  [key in Size]: object;
} = {
  L: {
    variant: "body",
    fontWeight: "medium",
    numberOfLine: 1,
    paddingTop: 2,
  },
  M: {
    variant: "paragraph",
    fontWeight: "medium",
    numberOfLine: 1,
    paddingTop: 2,
  },
  S: {
    variant: "paragraph",
    fontWeight: "medium",
    numberOfLine: 1,
    display: "none",
  },
};

export const Subtitle = ({ label, size }: LabelProps) => {
  const { colors } = useTheme();

  return (
    <Text {...SubtitleSizes[size]} color={colors.neutral.c70}>
      {label}
    </Text>
  );
};

export const PriceSizes: {
  [key in Size]: object;
} = {
  L: {
    variant: "large",
    fontWeight: "medium",
    numberOfLine: 1,
    paddingTop: 12,
  },
  M: {
    variant: "paragraph",
    fontWeight: "medium",
    numberOfLine: 1,
    paddingTop: 12,
  },
  S: {
    variant: "paragraph",
    fontWeight: "medium",
    numberOfLine: 1,
    paddingTop: 4,
  },
};

export const Price = ({ label, size }: LabelProps) => {
  const { colors } = useTheme();

  return (
    <Text {...PriceSizes[size]} color={colors.neutral.c70} style={PriceSizes[size]}>
      {label}
    </Text>
  );
};
