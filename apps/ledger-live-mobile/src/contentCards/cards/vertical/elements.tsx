import { Flex, Icons, Text, Button as SystemButton } from "@ledgerhq/native-ui";
import React, { PropsWithChildren } from "react";
import { Image as NativeImage, Pressable, StyleProp, View, ViewStyle } from "react-native";
import { useTheme } from "styled-components/native";
import { ButtonAction } from "~/contentCards/cards/types";
import { Size } from "~/contentCards/cards/vertical/types";
import { WidthFactor } from "~/contentCards/layouts/types";

export const ImageStyles: {
  [key in Size]: object;
} = {
  L: {
    flex: 1,
    width: "100%",
    maxHeight: 260,
    marginBottom: 32,
    marginTop: 24,
  },
  M: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 160,
    marginBottom: 32,
    marginTop: 24,
  },
  S: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 90,
    marginTop: 10,
  },
};

type ImageProps = {
  uri: string;
  size: Size;
  filledImage?: boolean;
};

export const Image = ({ uri, size, filledImage }: ImageProps) => {
  const isBigCardAndFilled = (size === "L" && filledImage) || false;
  const stylesBigCard = isBigCardAndFilled
    ? { marginBottom: 24, marginTop: 0, borderTopLeftRadius: 12, borderTopRightRadius: 12 }
    : { aspectRatio: 1 };
  return (
    <NativeImage
      source={{ uri }}
      style={{ ...ImageStyles[size], ...stylesBigCard }}
      resizeMode={isBigCardAndFilled ? "cover" : "contain"}
    />
  );
};

const absoluteTopStyle: StyleProp<ViewStyle> = {
  position: "absolute",
  padding: 12,
  zIndex: 1,
};

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

export const TitleStyles: {
  [key in Size]: object;
} = {
  L: {
    variant: "large",
    fontWeight: "medium",
    numberOfLine: 1,
    paddingBottom: 2,
    textAlign: "center",
  },
  M: {
    variant: "body",
    fontWeight: "medium",
    numberOfLine: 1,
    paddingBottom: 2,
    textAlign: "center",
  },
  S: {
    variant: "body",
    fontWeight: "medium",
    numberOfLine: 1,
    textAlign: "center",
  },
};

export const Title = ({ label, size }: LabelProps) => {
  return <Text {...TitleStyles[size]}>{label}</Text>;
};

export const SubtitleStyles: {
  [key in Size]: object;
} = {
  L: {
    variant: "body",
    fontWeight: "medium",
    numberOfLine: 1,
    textAlign: "center",
  },
  M: {
    variant: "paragraph",
    fontWeight: "medium",
    numberOfLine: 1,
    textAlign: "center",
  },
  S: {
    display: "none",
  },
};

export const Subtitle = ({ label, size }: LabelProps) => {
  const { colors } = useTheme();

  return (
    <Text {...SubtitleStyles[size]} color={colors.neutral.c70}>
      {label}
    </Text>
  );
};

export const PriceStyles: {
  [key in Size]: object;
} = {
  L: {
    variant: "large",
    fontWeight: "medium",
    numberOfLine: 1,
    paddingTop: 12,
    textAlign: "center",
  },
  M: {
    variant: "paragraph",
    fontWeight: "medium",
    numberOfLine: 1,
    paddingTop: 12,
    textAlign: "center",
  },
  S: {
    variant: "paragraph",
    fontWeight: "medium",
    numberOfLine: 1,
    paddingTop: 4,
    textAlign: "center",
  },
};

export const Price = ({ label, size }: LabelProps) => {
  const { colors } = useTheme();

  return (
    <Text {...PriceStyles[size]} color={colors.neutral.c70} style={PriceStyles[size]}>
      {label}
    </Text>
  );
};

export const ButtonStyles: {
  [key in Size]: object;
} = {
  L: {
    paddingX: 10,
    paddingY: 20,
    marginTop: 24,
  },
  M: {
    paddingX: 10,
    paddingY: 20,
  },
  S: {
    paddingX: 10,
    paddingY: 20,
  },
};

export const ButtonlabelStyles: {
  [key in Size]: object;
} = {
  L: {
    variant: "paragraph",
    fontWeight: "semiBold",
    numberOfLine: 1,
  },
  M: {
    variant: "paragraph",
    fontWeight: "semiBold",
    numberOfLine: 1,
  },
  S: {
    variant: "paragraph",
    fontWeight: "semiBold",
    numberOfLine: 1,
  },
};

export const Button = ({ label, size, action }: LabelProps & { action?: () => void }) => {
  return (
    <SystemButton {...ButtonStyles[size]} type="main" style={ButtonStyles[size]} onPress={action}>
      <Text color="neutral.c00" {...ButtonlabelStyles[size]}>
        {label}
      </Text>
    </SystemButton>
  );
};

export const ContainerStyles = (size: Size, widthFactor: WidthFactor): object => {
  const styles = {
    L: {
      height: 406,
      paddingBottom: 24,
      borderRadius: 12,
    },
    M: {
      height: widthFactor === WidthFactor.ThreeQuarters ? 300 : 220,
      paddingBottom: 24,
      borderRadius: 16,
    },
    S: {
      height: 156,
      paddingBottom: 8,
      borderRadius: 16,
    },
  };

  return styles[size];
};

export const Container = ({
  size,
  children,
  widthFactor,
}: { size: Size } & PropsWithChildren & { widthFactor: WidthFactor }) => {
  const { colors } = useTheme();
  const styles = ContainerStyles(size, widthFactor);
  return (
    <View
      style={{
        position: "relative",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: colors.opacityDefault.c05,
        ...styles,
      }}
    >
      {children}
    </View>
  );
};
