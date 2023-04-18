import React from "react";
import { View } from "react-native";
import { useTheme } from "styled-components/native";
import FlexBox from "../../../src/components/Layout/Flex";
import Row from "../../../src/components/Layout/Table/Row";
import Text from "../../../src/components/Text";
import { Icons } from "../../../src/assets";

export default {
  title: "Layout/Table/Row",
  component: Row,
};

const Icon = (props: { size?: number }): React.ReactElement => (
  <View
    style={{
      height: props.size,
      width: props.size,
      borderRadius: props.size,
      backgroundColor: "orange",
    }}
  />
);

const TopLeft = ({ text }: { text: string | undefined }) => {
  const {
    colors: { neutral, success },
  } = useTheme();
  return (
    <FlexBox flexDirection="row" flexShrink={1} alignItems="center">
      <Text color={neutral.c100} variant="body" fontWeight="semiBold" mr={2}>
        {text}
      </Text>
      <Icons.CircledCheckMedium size={12.5} color={success.c100} />
    </FlexBox>
  );
};
const BottomLeft = ({ text }: { text: string | undefined }) => {
  const { colors } = useTheme();
  return (
    <Text variant="body" color={colors.neutral.c70}>
      {text}
    </Text>
  );
};

const TopRight = ({ text }: { text: string | undefined }) => {
  const { colors } = useTheme();
  return (
    <Text color={colors.neutral.c100} variant="body" fontWeight="semiBold">
      {text}
    </Text>
  );
};

const BottomRight = ({ text }: { text: string | undefined }) => {
  const { colors } = useTheme();
  return (
    <Text variant="paragraph" fontWeight="medium" color={colors.neutral.c70}>
      {text}
    </Text>
  );
};

const ARow = (args: typeof DefaultArgs) => {
  const { hasTopLeft, hasBottomLeft, hasTopRight, hasBottomRight, hasIcon } = args;
  return (
    <Row
      Icon={hasIcon ? Icon : undefined}
      topLeft={hasTopLeft && <TopLeft text={args.topLeftText} />}
      bottomLeft={hasBottomLeft && <BottomLeft text={args.bottomLeftText} />}
      topRight={hasTopRight && <TopRight text={args.topRightText} />}
      bottomRight={hasBottomRight && <BottomRight text={args.bottomRightText} />}
      iconBorder={args.iconBorder}
    />
  );
};

export const Default = (args: typeof DefaultArgs) => (
  <FlexBox flexDirection="column" width={"100%"}>
    <ARow {...args} />
  </FlexBox>
);
Default.storyName = "Row";
const DefaultArgs = {
  topLeftText: "Bitcoin 1",
  bottomLeftText: "Native Segwit",
  topRightText: "1.23456 BTC",
  bottomRightText: "$74,590.81",
  hasTopLeft: true,
  hasBottomLeft: true,
  hasTopRight: true,
  hasBottomRight: true,
  hasIcon: true,
  iconBorder: false,
};
Default.args = DefaultArgs;
