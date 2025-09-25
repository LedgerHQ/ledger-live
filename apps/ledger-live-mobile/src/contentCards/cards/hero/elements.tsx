import { Flex, Text } from "@ledgerhq/native-ui";
import React from "react";
import { Image as NativeImage } from "react-native";
import { useTheme } from "styled-components/native";

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

type LabelProps = {
  label: string;
  hasSecondaryText?: boolean;
  isCentered?: boolean;
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

export const Title = ({ label, hasSecondaryText, isCentered }: LabelProps) => {
  const { colors } = useTheme();

  return (
    <Text
      variant="large"
      fontWeight="medium"
      textAlign={isCentered ? "center" : "start"}
      color={!hasSecondaryText ? colors.neutral.c80 : colors.neutral.c100}
      lineHeight={"18px"}
    >
      {label.replace(/\\n/g, "\n")}
    </Text>
  );
};

export const SecondaryText = ({
  label,
  isCentered,
}: {
  label: string;
  isCentered: boolean | undefined;
}) => {
  const { colors } = useTheme();

  return (
    <Text
      variant="body"
      fontWeight="medium"
      color={colors.neutral.c70}
      textAlign={isCentered ? "center" : "start"}
      lineHeight={"16px"}
    >
      {label.replace(/\\n/g, "\n")}
    </Text>
  );
};
