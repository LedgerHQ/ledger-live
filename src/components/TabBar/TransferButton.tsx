import React, { useCallback } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import { StyleProp, TouchableOpacity, ViewStyle } from "react-native";
import styled from "styled-components/native";
import { track } from "../../analytics";

type Props = {
  title: string;
  description: string;
  tag?: string;
  Icon: IconType;
  onPress?: (() => any) | null;
  disabled?: boolean;
  event?: string;
  eventProperties?: any;
  style?: StyleProp<ViewStyle>;
};

const CircleContainer = styled(Flex).attrs({
  height: 40,
  width: 40,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: "neutral.c50",
  justifyContent: "center",
  alignItems: "center",
})``;

const Tag = ({
  text,
  style,
}: {
  text: string;
  style: StyleProp<ViewStyle>;
}) => (
  <Flex
    backgroundColor="primary.c80"
    height="11px"
    borderRadius="1px"
    px="3px"
    flexDirection="row"
    alignItems="center"
    alignSelf="center"
    style={style}
  >
    <Text
      fontFamily="Inter"
      fontSize="6px"
      fontWeight="bold"
      verticalAlign="center"
      uppercase
      color="neutral.c20"
    >
      {text}
    </Text>
  </Flex>
);

const CircledIcon = ({ Icon }: { Icon: Props["Icon"] }) => (
  <CircleContainer>
    <Icon size={16} color="neutral.c100" />
  </CircleContainer>
);

export default function TransferButton({
  title,
  description,
  tag,
  Icon,
  onPress,
  disabled,
  event = "button_clicked",
  eventProperties,
  style,
}: Props) {
  const handlePress = useCallback(() => {
    if (onPress) onPress();
    if (event) track(event, eventProperties ?? null);
  }, [onPress, event, eventProperties]);

  return (
    <TouchableOpacity disabled={disabled} onPress={handlePress} style={[style]}>
      <Flex flexDirection="row" justifyContent="flex-start" alignItems="center">
        <CircledIcon Icon={Icon} />
        <Flex
          flexDirection="column"
          justifyContent="space-between"
          alignItems="flex-start"
          ml="16px"
          py="1px"
        >
          <Flex flexDirection="row">
            <Text variant="large" fontWeight="semiBold">
              {title}
            </Text>
            {tag && <Tag text={tag} style={{ marginLeft: 10 }} />}
          </Flex>
          <Text variant="body" fontWeight="medium" color="neutral.c70">
            {description}
          </Text>
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
}
