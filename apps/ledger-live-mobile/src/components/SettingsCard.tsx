import React from "react";
import { View } from "react-native";
import styled from "styled-components/native";
import { RectButton } from "react-native-gesture-handler";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import { Box, BoxedIcon, Text } from "@ledgerhq/native-ui";
import { ChevronRightMedium } from "@ledgerhq/native-ui/assets/icons";

type Props = {
  title: string;
  desc: string;
  Icon: IconType;
  onClick: () => void;
  arrowRight?: boolean;
  settingsCardTestId?: string;
};

function Card({
  onPress,
  children,
  ...otherProps
}: {
  children?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Box borderBottomColor={"neutral.c40"} borderBottomWidth={"1px"}>
      {onPress ? (
        <RectButton onPress={onPress} {...otherProps}>
          {children}
        </RectButton>
      ) : (
        <View {...otherProps}>{children}</View>
      )}
    </Box>
  );
}

const StyledCard = styled(Card)`
  background-color: ${p => p.theme.colors.palette.background.main};
  padding: ${p => p.theme.space[7]}px ${p => p.theme.space[6]}px;
  flex-direction: row;
  align-items: center;
`;

export default function SettingsCard({
  title,
  desc,
  Icon,
  onClick,
  arrowRight,
  settingsCardTestId,
}: Props) {
  return (
    <StyledCard onPress={onClick}>
      <BoxedIcon
        variant={"circle"}
        Icon={Icon}
        size={40}
        iconSize={16}
        borderColor={"primary.c80"}
        iconColor={"primary.c80"}
      />
      <Box ml={6} flex={1} testID={settingsCardTestId}>
        <Text variant={"large"} fontWeight={"semiBold"} color={"neutral.c100"}>
          {title}
        </Text>
        <Text variant={"body"} fontWeight={"medium"} color={"neutral.c80"}>
          {desc}
        </Text>
      </Box>
      {arrowRight && (
        <Box marginLeft={4}>
          <ChevronRightMedium size={16} color={"neutral.c70"} />
        </Box>
      )}
    </StyledCard>
  );
}
