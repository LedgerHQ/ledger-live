import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import React from "react";
import { Image as NativeImage, Pressable } from "react-native";
import { useTheme } from "styled-components/native";
import { ButtonAction } from "~/contentCards/cards/types";

export const Image = ({ uri }: { uri: string }) => {
  return (
    <NativeImage
      source={{ uri }}
      resizeMode="cover"
      borderRadius={12}
      style={{ width: "100%", height: 134 }}
    />
  );
};

export const Close = ({ onPress }: { onPress: ButtonAction }) => {
  return (
    <Pressable onPress={onPress} hitSlop={11}>
      <Icons.Close size="XS" />
    </Pressable>
  );
};

type LabelProps = {
  label: string;
};

export const Tag = ({ label }: LabelProps) => {
  const { colors } = useTheme();

  return (
    <Flex
      position="absolute"
      backgroundColor={colors.opacityReverse.c70}
      style={{ top: 12, left: 12 }}
      borderRadius={4}
      px={"6px"}
      pt={"4px"}
      pb={"5px"}
    >
      <Text fontWeight="bold" color={colors.neutral.c100} variant="small">
        {label}
      </Text>
    </Flex>
  );
};

export const Title = ({ label }: LabelProps) => {
  const { colors } = useTheme();

  return (
    <Text variant="body" fontWeight="medium" color={colors.neutral.c80} lineHeight={"18px"}>
      {label}
    </Text>
  );
};
