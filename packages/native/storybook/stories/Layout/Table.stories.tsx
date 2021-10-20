import { View } from "react-native";
import { storiesOf } from "@storybook/react-native";
import { useTheme } from "styled-components/native";
import { radios, text, withKnobs, boolean } from "@storybook/addon-knobs";
import React from "react";
import FlexBox from "@components/Layout/Flex";
import Row from "@components/Layout/Table/Row";
import Text from "@components/Text";
import CenterView from "../CenterView";
import CircledCheck from "@assets/icons/CircledCheckRegular";

const Icon = ({ size }) => (
  <View
    style={{
      height: size,
      width: size,
      borderRadius: size,
      backgroundColor: "orange",
    }}
  />
);

const TopLeft = () => {
  const {
    colors: {
      palette: { neutral, success },
    },
  } = useTheme();
  return (
    <FlexBox flexDirection="row" flexShrink={1} alignItems="center">
      <Text color={neutral.c100} type="body" fontWeight="semibold" mr={2}>
        {text("topLeftText", "Bitcoin 1", "content")}
      </Text>
      <CircledCheck size={12.5} color={success.c100} />
    </FlexBox>
  );
};
const BottomLeft = () => {
  const { colors } = useTheme();
  return (
    <Text type="navigation" color={colors.palette.neutral.c70}>
      {text("bottomLeftText", "Native Segwit", "content")}
    </Text>
  );
};

const TopRight = () => {
  const { colors } = useTheme();
  return (
    <Text color={colors.palette.neutral.c100} type="body" fontWeight="semibold">
      {text("topRightText", "1.23456 BTC", "content")}
    </Text>
  );
};

const BottomRight = () => {
  const { colors } = useTheme();
  return (
    <Text
      type="paragraph"
      fontWeight="medium"
      color={colors.palette.neutral.c70}
    >
      {text("bottomRightText", "$74,590.81", "content")}
    </Text>
  );
};

const ARow = () => {
  const [hasTopLeft, hasBottomLeft, hasTopRight, hasBottomRight, hasIcon] = [
    "TopLeft",
    "BottomLeft",
    "TopRight",
    "BottomRight",
    "Icon",
  ].map((item) => radios(item, { [item]: 1, null: null }, 1, "props"));
  return (
    <Row
      Icon={hasIcon && Icon}
      topLeft={hasTopLeft && <TopLeft />}
      bottomLeft={hasBottomLeft && <BottomLeft />}
      topRight={hasTopRight && <TopRight />}
      bottomRight={hasBottomRight && <BottomRight />}
      iconBorder={boolean("iconBorder", false, "props")}
    />
  );
};

storiesOf("Layout", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("Table/Row", () => (
    <FlexBox flexDirection="column" width={"100%"}>
      <ARow />
    </FlexBox>
  ));
