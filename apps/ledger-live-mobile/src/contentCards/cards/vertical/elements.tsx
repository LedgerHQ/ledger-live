import { Flex, Icons, Text, Button as SystemButton } from "@ledgerhq/native-ui";
import React, { PropsWithChildren } from "react";
import { Pressable, StyleProp, View, ViewStyle } from "react-native";
import Video from "react-native-video";
import { useTheme } from "styled-components/native";
import { ButtonAction } from "~/contentCards/cards/types";
import { Size } from "~/contentCards/cards/vertical/types";
import { WidthFactor } from "~/contentCards/layouts/types";
import FastImage from "react-native-fast-image";

export const MediaStyles: {
  [key in Size]: object;
} = {
  L: {
    flex: 1,
    width: "100%",
    maxHeight: 260,
    height: 260,
    alignSelf: "center",
  },
  M: {
    flex: 1,
    width: "100%",
    maxHeight: 160,
    height: 160,
    alignSelf: "center",
    marginTop: 24,
  },
  S: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 90,
    height: 90,
    alignSelf: "center",
    marginTop: 10,
  },
};

type MediaProps = {
  uri: string;
  size: Size;
  filledImage?: boolean;
  isMediaOnly?: boolean;
  mediaType: "image" | "video" | "gif";
};

export const Media = ({ uri, size, filledImage, isMediaOnly, mediaType }: MediaProps) => {
  const isBigCardAndFilled = (size === "L" && filledImage) || false;
  const isMediumCardAndFilled = (size === "M" && filledImage) || false;
  const isBigOrMediumCardAndFilled = isBigCardAndFilled || isMediumCardAndFilled;

  const mediaOnlyStyle = isMediaOnly &&
    isBigCardAndFilled && {
      height: 282,
      maxHeight: 282,
    };

  const extraStylesCard = isBigOrMediumCardAndFilled
    ? {
        marginBottom: 0,
        marginTop: 0,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        borderBottomLeftRadius:
          isMediumCardAndFilled || (isMediaOnly && isBigCardAndFilled) ? 12 : 0,
        borderBottomRightRadius:
          isMediumCardAndFilled || (isMediaOnly && isBigCardAndFilled) ? 12 : 0,
      }
    : { aspectRatio: 1 };

  if (mediaType === "video") {
    return (
      <Video
        source={{ uri }}
        style={{ ...MediaStyles[size], ...extraStylesCard, ...mediaOnlyStyle }}
        resizeMode={isBigOrMediumCardAndFilled ? "cover" : "contain"}
        fullscreen={false}
        paused={false}
        repeat={true}
        muted={true}
      />
    );
  } else {
    return (
      <FastImage
        source={{ uri }}
        style={{ ...MediaStyles[size], ...extraStylesCard, ...mediaOnlyStyle }}
        resizeMode={isBigOrMediumCardAndFilled ? "cover" : "contain"}
      />
    );
  }
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
  textAlign?: CanvasTextAlign;
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
    paddingBottom: 2,
  },
  M: {
    variant: "body",
    fontWeight: "medium",
    numberOfLine: 1,
    paddingBottom: 2,
  },
  S: {
    variant: "body",
    fontWeight: "medium",
    numberOfLine: 1,
  },
};

export const Title = ({ label, size, textAlign }: LabelProps) => {
  return (
    <Text textAlign={textAlign} {...TitleStyles[size]}>
      {label}
    </Text>
  );
};

export const DescriptionStyles: {
  [key in Size]: object;
} = {
  L: {
    variant: "body",
    fontWeight: "medium",
  },
  M: {
    variant: "paragraph",
    fontWeight: "medium",
    numberOfLines: 2,
  },
  S: {
    display: "none",
  },
};

export const Description = ({ label, size, textAlign }: LabelProps) => {
  const { colors } = useTheme();

  return (
    <Text
      alignSelf={textAlign}
      textAlign={textAlign}
      {...DescriptionStyles[size]}
      color={colors.neutral.c70}
    >
      {label.replace(/\\n/g, "\n")}
    </Text>
  );
};

export const SubDescriptionStyles: {
  [key in Size]: object;
} = {
  L: {
    variant: "large",
    fontWeight: "medium",
    numberOfLines: 1,
    paddingTop: 12,
    textAlign: "center",
  },
  M: {
    variant: "paragraph",
    fontWeight: "medium",
    numberOfLines: 1,
    paddingTop: 12,
    textAlign: "center",
  },
  S: {
    variant: "paragraph",
    fontWeight: "medium",
    numberOfLines: 1,
    paddingTop: 4,
    textAlign: "center",
  },
};

export const SubDescription = ({ label, size }: LabelProps) => {
  const { colors } = useTheme();

  return (
    <Text
      {...SubDescriptionStyles[size]}
      color={colors.neutral.c70}
      style={SubDescriptionStyles[size]}
    >
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
    numberOfLines: 1,
  },
  M: {
    variant: "paragraph",
    fontWeight: "semiBold",
    numberOfLines: 1,
  },
  S: {
    variant: "paragraph",
    fontWeight: "semiBold",
    numberOfLines: 1,
  },
};

export const Button = ({
  label,
  size,
  textAlign: descriptionAlign,
  action,
}: LabelProps & { action?: () => void }) => {
  const alignSelf = descriptionAlign === "center" ? "center" : "flex-start";

  return (
    <SystemButton
      {...ButtonStyles[size]}
      type="main"
      style={(ButtonStyles[size], { alignSelf })}
      onPress={action}
    >
      <Text color="neutral.c00" {...ButtonlabelStyles[size]}>
        {label}
      </Text>
    </SystemButton>
  );
};

export const ContainerStyles = (
  size: Size,
  widthFactor: WidthFactor,
  isMediaOnly?: boolean,
): object => {
  const styles = {
    L: {
      paddingBottom: isMediaOnly ? 0 : 12,
      justifyContent: isMediaOnly ? "center" : "space-between",
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
  isMediaOnly,
}: { size: Size; isMediaOnly?: boolean } & PropsWithChildren & { widthFactor: WidthFactor }) => {
  const { colors } = useTheme();
  const styles = ContainerStyles(size, widthFactor, isMediaOnly);
  return (
    <Flex
      width={"100%"}
      style={{
        position: "relative",
        backgroundColor: colors.opacityDefault.c05,
        ...styles,
      }}
    >
      {children}
    </Flex>
  );
};
