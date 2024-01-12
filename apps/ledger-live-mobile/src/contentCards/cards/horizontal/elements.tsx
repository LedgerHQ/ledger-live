import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import React from "react";
import { Image as NativeImage, Pressable } from "react-native";
import { useTheme } from "styled-components/native";
import { ButtonAction } from "~/contentCards/cards/types";

export const Image = ({ uri }: { uri: string }) => {
  return (
    <Flex width={40} height={40}>
      <NativeImage source={{ uri }} borderRadius={9999} style={{ width: "100%", height: "100%" }} />
    </Flex>
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
    <Flex bg={colors.primary.c80} borderRadius={"4px"} height={"18px"} justifyContent="center">
      <Text variant="small" fontWeight="bold" px={"6px"} color={colors.neutral.c00}>
        {label}
      </Text>
    </Flex>
  );
};

export const Title = ({ label }: LabelProps) => {
  return (
    <Text variant="body" fontWeight="medium" numberOfLines={1}>
      {label}
    </Text>
  );
};

export const Subtitle = ({ label }: LabelProps) => {
  const { colors } = useTheme();

  return (
    <Text variant="paragraph" fontWeight="medium" color={colors.neutral.c70} numberOfLines={1}>
      {label}
    </Text>
  );
};
