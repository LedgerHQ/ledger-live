import React from "react";
import { useTheme } from "@react-navigation/native";
import { Stop } from "react-native-svg";
import { Text } from "@ledgerhq/native-ui";
import { View } from "react-native-animatable";
import { BackgroundGradientHorizontal } from "~/components/TabBar/BackgroundGradient";

const gradientsCta = {
  dark: {
    opacity: 1,
    stops: [
      <Stop key="0%" offset="0%" stopOpacity={1} stopColor={"#A297E3"} />,
      <Stop key="100%" offset="100%" stopOpacity={1} stopColor={"#6756D1"} />,
    ],
  },
  light: {
    opacity: 1,
    stops: [
      <Stop key="0%" offset="0%" stopOpacity={1} stopColor={"#8675F1"} />,
      <Stop key="100%" offset="100%" stopOpacity={1} stopColor={"#4531C0"} />,
    ],
  },
};

interface PropsCta {
  text: string;
}

export function Cta({ text }: PropsCta) {
  const { colors, dark } = useTheme();

  return (
    <View
      style={{
        borderRadius: 20,
        width: 110,
        height: 40,
        marginRight: 12,
        overflow: "hidden",
        elevation: 4,
        shadowColor: "#000000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { height: 4, width: 0 },
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <BackgroundGradientHorizontal {...gradientsCta[dark ? "dark" : "light"]} />
      <Text
        variant="paragraph"
        fontWeight="semiBold"
        color={colors.text}
        p={0}
        style={{
          color: "white",
        }}
      >
        {text}
      </Text>
    </View>
  );
}
